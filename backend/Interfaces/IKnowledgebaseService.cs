using backend.Dtos.Knowledgebase;

namespace backend.Interfaces
{
    public interface IKnowledgebaseService
    {
        Task<IEnumerable<KnowledgebaseDto>> GetAllAsync();
        Task<KnowledgebaseDto?> GetByIdAsync(Guid id);
        Task<KnowledgebaseDto> CreateAsync(CreateKnowledgebaseDto dto);
        Task<KnowledgebaseDto?> UpdateAsync(Guid id, UpdateKnowledgebaseDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
