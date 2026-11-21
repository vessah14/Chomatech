using backend.Data;
using backend.Dtos.DemandeProduit;
using backend.Dtos.Paiement;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public sealed class PaiementService : IPaiementService
    {
        private readonly AppDbContext _context;
        private readonly IDemandeProduitService _demandeProduitService;
        private readonly ISasPayGateway _sasPay;
        private readonly IConfiguration _configuration;

        public PaiementService(
            AppDbContext context,
            IDemandeProduitService demandeProduitService,
            ISasPayGateway sasPay,
            IConfiguration configuration)
        {
            _context = context;
            _demandeProduitService = demandeProduitService;
            _sasPay = sasPay;
            _configuration = configuration;
        }

        public async Task<PaiementCheckoutDto> DemarrerPanierAsync(
            Guid clientId,
            Guid requestKey,
            CreateDemandesProduitLotDto commande,
            CancellationToken cancellationToken = default)
        {
            VerifierConfiguration();

            var existant = await _context.Paiements
                .SingleOrDefaultAsync(p => p.ClientId == clientId && p.RequestKey == requestKey, cancellationToken);
            if (existant is not null)
            {
                return existant.CheckoutUrl is not null
                    ? new PaiementCheckoutDto(existant.Id, existant.CheckoutUrl, existant.Statut)
                    : throw new InvalidOperationException("Cette tentative de paiement est déjà en cours ou a échoué. Relancez une nouvelle tentative.");
            }

            var paiement = new Paiement
            {
                Id = Guid.NewGuid(),
                ClientId = clientId,
                RequestKey = requestKey,
                Montant = 0,
                Devise = Devise,
                Statut = "CREATING",
                CreatedAt = DateTimeOffset.UtcNow
            };
            _context.Paiements.Add(paiement);

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                _context.Entry(paiement).State = EntityState.Detached;
                existant = await _context.Paiements
                    .SingleOrDefaultAsync(p => p.ClientId == clientId && p.RequestKey == requestKey, cancellationToken);
                if (existant?.CheckoutUrl is not null)
                {
                    return new PaiementCheckoutDto(existant.Id, existant.CheckoutUrl, existant.Statut);
                }
                throw new InvalidOperationException("Cette tentative de paiement est déjà en cours.");
            }

            IEnumerable<Dtos.DemandeProduit.DemandeProduitDto> demandes;
            try
            {
                demandes = await _demandeProduitService.CreateLotAsync(clientId, commande);
            }
            catch
            {
                paiement.Statut = "FAILED";
                await _context.SaveChangesAsync(cancellationToken);
                throw;
            }

            var ids = demandes.Select(d => d.Id).ToArray();
            var lignes = await _context.DemandesProduits
                .Where(d => ids.Contains(d.Id))
                .ToListAsync(cancellationToken);
            paiement.Montant = lignes.Sum(d => d.MontantUnitaire * d.Quantite);
            foreach (var ligne in lignes)
            {
                ligne.Paiement = paiement;
            }
            await _context.SaveChangesAsync(cancellationToken);

            try
            {
                return await CreerCheckoutAsync(paiement, "Commande CHOMA TECH", cancellationToken);
            }
            catch
            {
                paiement.Statut = "FAILED";
                await _context.SaveChangesAsync(cancellationToken);
                foreach (var demande in demandes)
                {
                    await _demandeProduitService.UpdateStatutAsync(
                        demande.Id,
                        new UpdateDemandeProduitStatutDto { Statut = "Annulée" });
                }
                throw;
            }
        }

        public async Task<PaiementCheckoutDto?> DemarrerServiceAsync(
            Guid clientId,
            Guid demandeServiceId,
            CancellationToken cancellationToken = default)
        {
            VerifierConfiguration();

            var demande = await _context.DemandesServices
                .Include(d => d.Client)
                .Include(d => d.Service)
                .SingleOrDefaultAsync(d => d.Id == demandeServiceId && d.ClientId == clientId, cancellationToken);
            if (demande is null) return null;
            if (demande.MontantConvenu is null or <= 0)
            {
                throw new InvalidOperationException("Le montant du service doit être fixé avant le paiement.");
            }
            if (demande.EstPaye)
            {
                throw new InvalidOperationException("Cette demande est déjà payée.");
            }

            if (demande.PaiementId.HasValue)
            {
                var existant = await _context.Paiements.FindAsync([demande.PaiementId.Value], cancellationToken);
                if (existant?.CheckoutUrl is not null && existant.Statut == "PENDING")
                {
                    return new PaiementCheckoutDto(existant.Id, existant.CheckoutUrl, existant.Statut);
                }
            }

            var paiement = new Paiement
            {
                Id = Guid.NewGuid(),
                ClientId = clientId,
                Montant = demande.MontantConvenu.Value,
                Devise = Devise,
                Statut = "CREATING",
                CreatedAt = DateTimeOffset.UtcNow,
                DemandesServices = [demande]
            };
            _context.Paiements.Add(paiement);
            await _context.SaveChangesAsync(cancellationToken);

            try
            {
                return await CreerCheckoutAsync(paiement, demande.Service?.NomService ?? "Service CHOMA TECH", cancellationToken);
            }
            catch
            {
                paiement.Statut = "FAILED";
                await _context.SaveChangesAsync(cancellationToken);
                throw;
            }
        }

        public async Task<PaiementStatutDto?> VerifierStatutAsync(
            Guid clientId,
            Guid paiementId,
            CancellationToken cancellationToken = default)
        {
            var paiement = await _context.Paiements
                .Include(p => p.DemandesProduits)
                .Include(p => p.DemandesServices)
                .SingleOrDefaultAsync(p => p.Id == paiementId && p.ClientId == clientId, cancellationToken);
            if (paiement is null) return null;

            if (paiement.Statut is "PAID" or "FAILED" or "EXPIRED" || paiement.SasPayCheckoutId is null)
            {
                return ToStatutDto(paiement);
            }

            var statutSasPay = await _sasPay.GetCheckoutStatusAsync(paiement.SasPayCheckoutId, cancellationToken);
            if (statutSasPay.Status == "PAID" && statutSasPay.TransactionStatus == "SUCCESS")
            {
                paiement.Statut = "PAID";
                foreach (var demande in paiement.DemandesProduits) demande.EstPaye = true;
                foreach (var demande in paiement.DemandesServices) demande.EstPaye = true;
                await _context.SaveChangesAsync(cancellationToken);
            }
            else if (statutSasPay.Status is "FAILED" or "EXPIRED" or "CANCELLED")
            {
                paiement.Statut = statutSasPay.Status;
                await _context.SaveChangesAsync(cancellationToken);
            }

            return ToStatutDto(paiement);
        }

        private async Task<PaiementCheckoutDto> CreerCheckoutAsync(
            Paiement paiement,
            string description,
            CancellationToken cancellationToken)
        {
            var client = await _context.Clients.FindAsync([paiement.ClientId], cancellationToken)
                ?? throw new InvalidOperationException("Le client associé au paiement est introuvable.");
            var urlSite = (_configuration["App:SiteUrl"] ?? "http://localhost:5173").TrimEnd('/');
            if (!Uri.TryCreate(urlSite, UriKind.Absolute, out var uriSite) || uriSite.Scheme is not ("http" or "https"))
            {
                throw new InvalidOperationException("App:SiteUrl doit contenir une URL HTTP(S) valide.");
            }

            var retour = $"{urlSite}/paiement/retour?paymentId={paiement.Id}";
            var session = await _sasPay.CreateCheckoutAsync(
                paiement.Montant,
                paiement.Devise,
                _configuration["SasPay:Country"] ?? "CM",
                description,
                client.Email,
                $"{client.Prenom} {client.Nom}".Trim(),
                retour,
                paiement.Id,
                cancellationToken);

            if (!Uri.TryCreate(session.CheckoutUrl, UriKind.Absolute, out var checkoutUri) || checkoutUri.Scheme != "https")
            {
                throw new HttpRequestException("SasPay a renvoyé une URL de paiement invalide.");
            }

            paiement.SasPayCheckoutId = session.Id;
            paiement.CheckoutUrl = session.CheckoutUrl;
            paiement.Statut = "PENDING";
            await _context.SaveChangesAsync(cancellationToken);

            return new PaiementCheckoutDto(paiement.Id, paiement.CheckoutUrl, paiement.Statut);
        }

        private void VerifierConfiguration()
        {
            if (string.IsNullOrWhiteSpace(_configuration["SasPay:ApiKey"]))
            {
                throw new InvalidOperationException("La clé SasPay est absente. Configurez SasPay__ApiKey côté backend.");
            }
        }

        private string Devise => _configuration["SasPay:Currency"] ?? "XAF";

        private static PaiementStatutDto ToStatutDto(Paiement paiement) =>
            new(paiement.Id, paiement.Statut, paiement.Statut == "PAID");
    }
}
