using backend.Dtos.Avis;

namespace backend.Interfaces
{
    public interface IAvisService
    {
        Task<IEnumerable<AvisDto>> GetAllAsync();
        Task<IEnumerable<AvisDto>> GetPublieesAsync();
        Task<IEnumerable<AvisDto>> GetByClientIdAsync(Guid clientId);
        Task<AvisDto?> GetByIdAsync(Guid id);
        Task<AvisDto> CreateAsync(Guid clientId, CreateAvisDto dto);
        Task<AvisDto?> UpdateStatutAsync(Guid id, UpdateAvisStatutDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
