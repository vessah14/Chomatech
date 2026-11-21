using backend.Controllers.Common;
using backend.Dtos.DemandeService;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/demandes-services")]
    [Authorize]
    public class DemandesServiceController : ControllerBase
    {
        private readonly IDemandeServiceService _demandeServiceService;

        public DemandesServiceController(IDemandeServiceService demandeServiceService)
        {
            _demandeServiceService = demandeServiceService;
        }

        // Vue globale (Admin) ou historique d'un client précis (self ou Admin).
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DemandeServiceDto>>> GetAll([FromQuery] Guid? clientId)
        {
            if (!clientId.HasValue)
            {
                if (!this.IsAdmin()) return Forbid();
                return Ok(await _demandeServiceService.GetAllAsync());
            }

            if (!this.IsAdmin() && this.GetUserId() != clientId) return Forbid();

            return Ok(await _demandeServiceService.GetByClientIdAsync(clientId.Value));
        }

        [HttpGet("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DemandeServiceDto>> GetById(Guid id)
        {
            var demande = await _demandeServiceService.GetByIdAsync(id);
            return demande is null ? NotFound() : Ok(demande);
        }

        [HttpPost]
        public async Task<ActionResult<DemandeServiceDto>> Create(CreateDemandeServiceDto dto)
        {
            // Un client ne peut demander un service qu'en son propre nom ; seul un Admin peut
            // saisir une demande pour un autre client.
            if (!this.IsAdmin())
            {
                var userId = this.GetUserId();
                if (userId is null) return Unauthorized();
                dto.ClientId = userId.Value;

                // Le montant est fixé par le catalogue ou chiffré par un admin, jamais
                // proposé par le client lui-même (sinon il choisirait son propre prix).
                dto.MontantConvenu = null;
            }

            var demande = await _demandeServiceService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = demande.Id }, demande);
        }

        [HttpPatch("{id:guid}/statut")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DemandeServiceDto>> UpdateStatut(Guid id, UpdateDemandeServiceStatutDto dto)
        {
            var demande = await _demandeServiceService.UpdateStatutAsync(id, dto);
            return demande is null ? NotFound() : Ok(demande);
        }

        [HttpPatch("{id:guid}/paiement")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DemandeServiceDto>> UpdatePaiement(Guid id, UpdateDemandeServicePaiementDto dto)
        {
            var demande = await _demandeServiceService.UpdatePaiementAsync(id, dto);
            return demande is null ? NotFound() : Ok(demande);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _demandeServiceService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }
}
