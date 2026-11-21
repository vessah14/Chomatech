using backend.Dtos.MessageContact;

namespace backend.Interfaces
{
    public interface IMessageContactService
    {
        Task<IEnumerable<MessageContactDto>> GetAllAsync();
        Task<MessageContactDto?> GetByIdAsync(Guid id);
        Task<MessageContactDto> CreateAsync(CreateMessageContactDto dto);
        Task<MessageContactDto?> UpdateStatutAsync(Guid id, UpdateMessageContactStatutDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
