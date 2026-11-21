using backend.Dtos.Conversation;

namespace backend.Interfaces
{
    public interface IConversationService
    {
        // Toutes les conversations, tous clients confondus — réservé à l'usage Admin
        // (vérifié au niveau du Controller, pas ici).
        Task<IEnumerable<ConversationDto>> GetAllAsync();
        Task<IEnumerable<ConversationDto>> GetByClientIdAsync(Guid clientId);
        Task<ConversationDto?> GetByIdAsync(Guid id);
        Task<ConversationDto> CreateAsync(CreateConversationDto dto);
    }
}
