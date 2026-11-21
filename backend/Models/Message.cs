using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Message")]
    public class Message
    {
        [Key]
        [Required]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("conversation_id")]
        public Guid ConversationId { get; set; }

        [ForeignKey(nameof(ConversationId))]
        public Conversation? Conversation { get; set; }

        // Valeurs attendues : "client" ou "admin" (contrainte CHECK côté base).
        [Required]
        [Column("sender")]
        public string Sender { get; set; } = string.Empty;

        [Required]
        [Column("message", TypeName = "text")]
        public string Contenu { get; set; } = string.Empty;

        [Required]
        [Column("lu")]
        public bool Lu { get; set; }

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; }
    }
}
