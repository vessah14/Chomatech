using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Service")]
    public class Service
    {
        [Key]
        [Required]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("nom_service")]
        public string NomService { get; set; } = string.Empty;

        [Required]
        [Column("categorie")]
        public string Categorie { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        // Nullable : certains services sont "Sur devis" et n'ont pas de montant fixe.
        [Column("montant", TypeName = "decimal(10,2)")]
        public decimal? Montant { get; set; }

        [Required]
        [Column("statut")]
        public string Statut { get; set; } = string.Empty;

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; }

        public ICollection<DemandeService> Demandes { get; set; } = new List<DemandeService>();
    }
}
