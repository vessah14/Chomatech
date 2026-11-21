using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Notification
{
    public class CreateNotificationDto
    {
        [Required, StringLength(250, MinimumLength = 2)]
        public string Titre { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Type { get; set; } = string.Empty;

        // Un client précis, ou null pour diffuser à tous les clients (le service crée alors
        // une ligne par client, chacune avec son propre état "Lu" indépendant).
        public Guid? ClientId { get; set; }

        [Required, StringLength(300)]
        public string Message { get; set; } = string.Empty;

        // Pas de "Lu" ici : une notification démarre toujours non lue.
    }

    public class NotificationDto
    {
        public Guid Id { get; set; }
        public string Titre { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public Guid ClientId { get; set; }
        public string ClientNom { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool Lu { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
