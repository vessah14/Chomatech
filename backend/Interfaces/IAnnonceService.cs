using backend.Dtos.Annonce;

namespace backend.Interfaces
{
    public interface IAnnonceService
    {
        Task<IEnumerable<AnnonceDto>> GetAllAsync();
        Task<AnnonceDto?> GetByIdAsync(Guid id);
        Task<AnnonceDto> CreateAsync(CreateAnnonceDto dto);
        Task<AnnonceDto?> UpdateAsync(Guid id, UpdateAnnonceDto dto);
        Task<bool> DeleteAsync(Guid id);

        // Incrémente le compteur "Vues" ; séparé du reste car appelé côté public (consultation),
        // pas depuis le formulaire admin.
        Task IncrementerVuesAsync(Guid id);
    }
}
