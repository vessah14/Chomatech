using backend.Dtos.DemandeService;

namespace backend.Interfaces
{
    public interface IDemandeServiceService
    {
        Task<IEnumerable<DemandeServiceDto>> GetAllAsync();
        Task<IEnumerable<DemandeServiceDto>> GetByClientIdAsync(Guid clientId);
        Task<DemandeServiceDto?> GetByIdAsync(Guid id);
        Task<DemandeServiceDto> CreateAsync(CreateDemandeServiceDto dto);
        Task<DemandeServiceDto?> UpdateStatutAsync(Guid id, UpdateDemandeServiceStatutDto dto);
        Task<DemandeServiceDto?> UpdatePaiementAsync(Guid id, UpdateDemandeServicePaiementDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
