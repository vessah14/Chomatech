using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Annonce")]
    public class Annonce
    {
        [Key]
        [Required]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("titre")]
        public string Titre { get; set; } = string.Empty;

        [Required]
        [Column("categorie")]
        public string Categorie { get; set; } = string.Empty;

        [Required]
        [Column("statut")]
        public string Statut { get; set; } = string.Empty;

        [Required]
        [Column("epingle")]
        public bool Epingle { get; set; }

        [Required]
        [Column("vues")]
        public int Vues { get; set; }

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; }
    }
}
