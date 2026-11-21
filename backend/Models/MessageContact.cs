using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    // Soumissions du formulaire de contact public (visiteur anonyme, pas de compte requis) :
    // distinct des Message/Conversation qui, eux, appartiennent à la messagerie client connecté.
    [Table("Message_Contact")]
    public class MessageContact
    {
        [Key]
        [Required]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("nom_complet")]
        public string NomComplet { get; set; } = string.Empty;

        [Required]
        [Column("email", TypeName = "citext")]
        public string Email { get; set; } = string.Empty;

        [Column("telephone")]
        public string? Telephone { get; set; }

        [Column("entreprise")]
        public string? Entreprise { get; set; }

        [Column("service_souhaite")]
        public string? ServiceSouhaite { get; set; }

        [Column("budget")]
        public string? Budget { get; set; }

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
