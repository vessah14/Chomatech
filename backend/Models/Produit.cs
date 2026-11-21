using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Produit")]
    public class Produit
    {
        [Key]
        [Required]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("nom_produit")]
        public string NomProduit { get; set; } = string.Empty;

        [Required]
        [Column("categorie")]
        public string Categorie { get; set; } = string.Empty;

        [Required]
        [Column("montant", TypeName = "decimal(10,2)")]
        public decimal Montant { get; set; }

        [Required]
        [Column("stock")]
        public int Stock { get; set; }

        [Column("image")]
        public string? Image { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Required]
        [Column("statut")]
        public string Statut { get; set; } = string.Empty;

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; }

        public ICollection<DemandeProduit> Demandes { get; set; } = new List<DemandeProduit>();
    }
}
