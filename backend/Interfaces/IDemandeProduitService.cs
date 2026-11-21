using backend.Dtos.DemandeProduit;

namespace backend.Interfaces
{
    public interface IDemandeProduitService
    {
        Task<IEnumerable<DemandeProduitDto>> GetAllAsync();
        Task<IEnumerable<DemandeProduitDto>> GetByClientIdAsync(Guid clientId);
        Task<DemandeProduitDto?> GetByIdAsync(Guid id);

        // Le montant unitaire est copié depuis Produit.Montant côté implémentation,
        // jamais reçu du client (voir commentaire dans CreateDemandeProduitDto).
        Task<DemandeProduitDto> CreateAsync(CreateDemandeProduitDto dto);
        Task<IEnumerable<DemandeProduitDto>> CreateLotAsync(Guid clientId, CreateDemandesProduitLotDto dto);

        Task<DemandeProduitDto?> UpdateStatutAsync(Guid id, UpdateDemandeProduitStatutDto dto);
        Task<DemandeProduitDto?> UpdateQuantiteClientAsync(Guid id, Guid clientId, UpdateDemandeProduitQuantiteDto dto);
        Task<DemandeProduitDto?> AnnulerClientAsync(Guid id, Guid clientId);
        Task<bool> DeleteClientAsync(Guid id, Guid clientId);
        Task<DemandeProduitDto?> UpdatePaiementAsync(Guid id, UpdateDemandeProduitPaiementDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
