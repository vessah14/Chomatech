using backend.Dtos.DemandeProduit;
using backend.Dtos.Paiement;

namespace backend.Interfaces
{
    public interface IPaiementService
    {
        Task<PaiementCheckoutDto> DemarrerPanierAsync(
            Guid clientId,
            Guid requestKey,
            CreateDemandesProduitLotDto commande,
            CancellationToken cancellationToken = default);

        Task<PaiementCheckoutDto?> DemarrerServiceAsync(
            Guid clientId,
            Guid demandeServiceId,
            CancellationToken cancellationToken = default);

        Task<PaiementStatutDto?> VerifierStatutAsync(
            Guid clientId,
            Guid paiementId,
            CancellationToken cancellationToken = default);
    }
}
