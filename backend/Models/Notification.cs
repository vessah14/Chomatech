using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Notification")]
    public class Notification
    {
        [Key]
        [Required]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("titre")]
        public string Titre { get; set; } = string.Empty;

        [Required]
        [Column("type")]
        public string Type { get; set; } = string.Empty;

        // Toujours un client réel, jamais un segment/texte libre : une notification "à tous"
        // se traduit par une ligne par client (voir NotificationService.CreateAsync), pas par
        // un destinataire partagé — sinon "Lu" serait un état partagé entre tous les clients.
        [Required]
        [Column("client_id")]
        public Guid ClientId { get; set; }

        [ForeignKey(nameof(ClientId))]
        public User? Client { get; set; }

        [Required]
        [Column("message")]
        public string Message { get; set; } = string.Empty;

        [Required]
        [Column("lu")]
        public bool Lu { get; set; }

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; }
    }
}
