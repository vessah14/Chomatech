using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Message
{
    public class CreateMessageDto
    {
        [Required]
        public Guid ConversationId { get; set; }

        // Pas de "Sender" ici volontairement : il est déduit du rôle du token côté serveur
        // (MessagesController.Create), jamais reçu du client (sinon un client pourrait se
        // faire passer pour "admin" dans sa propre conversation).
        [Required, StringLength(5000, MinimumLength = 1)]
        public string Contenu { get; set; } = string.Empty;
    }

    public class UpdateMessageDto
    {
        [Required, StringLength(5000, MinimumLength = 1)]
        public string Contenu { get; set; } = string.Empty;
    }

    public class MessageDto
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public string Sender { get; set; } = string.Empty;
        public string Contenu { get; set; } = string.Empty;
        public bool Lu { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
