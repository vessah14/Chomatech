using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Realisation")]
    public class Realisation
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

        // Liste de technologies stockée en texte séparé par des virgules (ex. "React,Node.js") :
        // reste cohérent avec le reste du schéma, qui n'utilise nulle part de colonne tableau.
        [Required]
        [Column("technologies")]
        public string Technologies { get; set; } = string.Empty;

        [Column("image")]
        public string? Image { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("lien")]
        public string? Lien { get; set; }

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; }
    }
}
