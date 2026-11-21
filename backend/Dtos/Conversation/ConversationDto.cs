using System.ComponentModel.DataAnnotations;
using backend.Dtos.Message;

namespace backend.Dtos.Conversation
{
    public class CreateConversationDto
    {
        [Required]
        public Guid ClientId { get; set; }
    }

    public class ConversationDto
    {
        public Guid Id { get; set; }
        public Guid ClientId { get; set; }
        public string ClientNom { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
        public List<MessageDto> Messages { get; set; } = new();
    }
}
