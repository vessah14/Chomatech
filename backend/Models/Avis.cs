using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Avis")]
    public class Avis
    {
        [Key]
        [Required]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("client_id")]
        public Guid ClientId { get; set; }

        [ForeignKey(nameof(ClientId))]
        public User? Client { get; set; }

        [Required]
        [Column("note")]
        public int Note { get; set; }

        [Required]
        [Column("commentaire", TypeName = "text")]
        public string Commentaire { get; set; } = string.Empty;

        // "En attente" (par défaut) ou "Publiée" — même logique binaire que l'admin
        // (Administration/Avis_client.jsx : Publier / Masquer).
        [Required]
        [Column("statut")]
        public string Statut { get; set; } = "En attente";

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; }
    }
}
