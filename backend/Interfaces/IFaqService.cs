using backend.Dtos.Faq;

namespace backend.Interfaces
{
    public interface IFaqService
    {
        Task<IEnumerable<FaqDto>> GetAllAsync();
        Task<FaqDto?> GetByIdAsync(Guid id);
        Task<FaqDto> CreateAsync(CreateFaqDto dto);
        Task<FaqDto?> UpdateAsync(Guid id, UpdateFaqDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
