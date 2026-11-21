using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using backend.Controllers.Common;
using backend.Data;
using backend.Dtos.Paiement;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/paiements")]
    [Authorize]
    public class PaiementsController : ControllerBase
    {
        private readonly IPaiementService _paiementService;
        private readonly AppDbContext _db;
        private readonly IConfiguration _configuration;

        public PaiementsController(
            IPaiementService paiementService,
            AppDbContext db,
            IConfiguration configuration)
        {
            _paiementService = paiementService;
            _db = db;
            _configuration = configuration;
        }

        [HttpPost("panier")]
        public async Task<ActionResult<PaiementCheckoutDto>> DemarrerPanier(
            [FromBody] DemarrerPaiementPanierDto dto,
            CancellationToken cancellationToken)
        {
            var userId = this.GetUserId();
            if (userId is null) return Unauthorized();

            try
            {
                var paiement = await _paiementService.DemarrerPanierAsync(
                    userId.Value,
                    dto.RequestKey,
                    dto.Commande,
                    cancellationToken);

                return Ok(paiement);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("services/{demandeServiceId:guid}/demarrer")]
        public async Task<ActionResult<PaiementCheckoutDto>> DemarrerService(Guid demandeServiceId, CancellationToken cancellationToken)
        {
            var userId = this.GetUserId();
            if (userId is null) return Unauthorized();

            try
            {
                var paiement = await _paiementService.DemarrerServiceAsync(userId.Value, demandeServiceId, cancellationToken);
                return paiement is null ? NotFound() : Ok(paiement);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{paiementId:guid}/statut")]
        public async Task<ActionResult<PaiementStatutDto>> GetStatut(Guid paiementId, CancellationToken cancellationToken)
        {
            var userId = this.GetUserId();
            if (userId is null) return Unauthorized();

            var paiement = await _paiementService.VerifierStatutAsync(userId.Value, paiementId, cancellationToken);
            return paiement is null ? NotFound() : Ok(paiement);
        }

        [AllowAnonymous]
        [HttpPost("webhooks/saspay")]
        public async Task<IActionResult> WebhookSasPay(CancellationToken cancellationToken)
        {
            var secret = _configuration["SasPay:WebhookSecret"] ?? _configuration["SasPay:WebhookSigningSecret"];
            if (string.IsNullOrWhiteSpace(secret))
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "SasPay webhook secret not configured." });
            }

            var rawBody = await new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true).ReadToEndAsync(cancellationToken);
            var signature = Request.Headers["X-Webhook-Signature"].ToString();
            var timestamp = Request.Headers["X-Webhook-Timestamp"].ToString();

            if (!ValiderSignature(rawBody, timestamp, signature, secret))
            {
                return Unauthorized();
            }

            JsonDocument document;
            try
            {
                document = JsonDocument.Parse(rawBody);
            }
            catch (JsonException)
            {
                return BadRequest(new { error = "Webhook body is not valid JSON." });
            }

            using (document)
            {
                var eventType = document.RootElement.TryGetProperty("event", out var eventElement)
                    ? eventElement.GetString()
                    : null;

                if (string.IsNullOrWhiteSpace(eventType))
                {
                    return BadRequest(new { error = "Webhook event is missing." });
                }

                var data = document.RootElement.TryGetProperty("data", out var dataElement)
                    ? dataElement
                    : default;

                var paiementId = ExtrairePaiementId(data);
                var sessionId = data.TryGetProperty("id", out var idElement) ? idElement.GetString() : null;

                if (paiementId is null && string.IsNullOrWhiteSpace(sessionId))
                {
                    return Ok(new { received = true, ignored = true });
                }

                var paiement = await _db.Paiements
                    .Include(p => p.DemandesProduits)
                    .Include(p => p.DemandesServices)
                    .FirstOrDefaultAsync(p =>
                        paiementId.HasValue && p.Id == paiementId.Value ||
                        (!string.IsNullOrWhiteSpace(sessionId) && p.SasPayCheckoutId == sessionId),
                        cancellationToken);

                if (paiement is null)
                {
                    return Ok(new { received = true, ignored = true });
                }

                paiement.Statut = MapperStatut(eventType, data);
                if (paiement.Statut == "PAID")
                {
                    foreach (var demande in paiement.DemandesProduits) demande.EstPaye = true;
                    foreach (var demande in paiement.DemandesServices) demande.EstPaye = true;
                }

                await _db.SaveChangesAsync(cancellationToken);
            }

            return Ok(new { received = true });
        }

        private static bool ValiderSignature(string rawBody, string timestamp, string signature, string secret)
        {
            if (string.IsNullOrWhiteSpace(timestamp) || string.IsNullOrWhiteSpace(signature))
            {
                return false;
            }

            if (!long.TryParse(timestamp, out var ts))
            {
                return false;
            }

            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            if (Math.Abs(now - ts) > 300)
            {
                return false;
            }

            var expected = Convert.ToHexString(
                HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes($"{timestamp}.{rawBody}"))
            ).ToLowerInvariant();

            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(signature.ToLowerInvariant()),
                Encoding.UTF8.GetBytes(expected));
        }

        private static Guid? ExtrairePaiementId(JsonElement data)
        {
            if (data.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            if (data.TryGetProperty("metadata", out var metadata) && metadata.ValueKind == JsonValueKind.Object)
            {
                if (metadata.TryGetProperty("chomatech_payment_id", out var paymentIdElement)
                    && Guid.TryParse(paymentIdElement.GetString(), out var paymentId))
                {
                    return paymentId;
                }
            }

            return null;
        }

        private static string MapperStatut(string eventType, JsonElement data)
        {
            var status = data.TryGetProperty("status", out var statusElement)
                ? statusElement.GetString()
                : null;

            return eventType switch
            {
                "transaction.success" => "PAID",
                "transaction.failed" => "FAILED",
                "transaction.cancelled" => "CANCELLED",
                "transaction.created" => "PENDING",
                _ => status is "SUCCESS" ? "PAID" : status ?? "PENDING"
            };
        }
    }
}
