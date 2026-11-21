using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Faq")]
    public class Faq
    {
        [Key]
        [Required]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("question")]
        public string Question { get; set; } = string.Empty;

        [Required]
        [Column("reponse", TypeName = "text")]
        public string Reponse { get; set; } = string.Empty;

        [Required]
        [Column("categorie")]
        public string Categorie { get; set; } = string.Empty;

        [Required]
        [Column("statut")]
        public string Statut { get; set; } = string.Empty;

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; }
    }
}
