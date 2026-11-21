using backend.Dtos.Service;

namespace backend.Interfaces
{
    // Nom un peu redondant ("Service" + "Service") mais cohérent avec l'entité "Service" du modèle.
    public interface IServiceService
    {
        Task<IEnumerable<ServiceDto>> GetAllAsync();
        Task<ServiceDto?> GetByIdAsync(Guid id);
        Task<ServiceDto> CreateAsync(CreateServiceDto dto);
        Task<ServiceDto?> UpdateAsync(Guid id, UpdateServiceDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
