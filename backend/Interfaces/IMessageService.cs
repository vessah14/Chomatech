using backend.Dtos.Message;

namespace backend.Interfaces
{
    public interface IMessageService
    {
        Task<IEnumerable<MessageDto>> GetByConversationIdAsync(Guid conversationId);
        Task<MessageDto?> GetByIdAsync(Guid id);
        Task<MessageDto> CreateAsync(CreateMessageDto dto, string sender);
        Task<MessageDto?> UpdateContenuAsync(Guid id, string contenu);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> MarkAsReadAsync(Guid id);
    }
}
