using backend.Dtos.Realisation;

namespace backend.Interfaces
{
    public interface IRealisationService
    {
        Task<IEnumerable<RealisationDto>> GetAllAsync();
        Task<RealisationDto?> GetByIdAsync(Guid id);
        Task<RealisationDto> CreateAsync(CreateRealisationDto dto);
        Task<RealisationDto?> UpdateAsync(Guid id, UpdateRealisationDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
