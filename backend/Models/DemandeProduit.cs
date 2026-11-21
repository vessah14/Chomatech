using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Demande_Produit")]
    public class DemandeProduit
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
        [Column("produit_id")]
        public Guid ProduitId { get; set; }

        [ForeignKey(nameof(ProduitId))]
        public Produit? Produit { get; set; }

        [Column("paiement_id")]
        public Guid? PaiementId { get; set; }

        [ForeignKey(nameof(PaiementId))]
        public Paiement? Paiement { get; set; }

        [Required]
        [Column("quantite")]
        public int Quantite { get; set; } = 1;

        // Prix figé au moment de la demande (indépendant du prix catalogue courant du produit).
        [Required]
        [Column("montant_unitaire", TypeName = "decimal(10,2)")]
        public decimal MontantUnitaire { get; set; }

        [Required]
        [Column("statut")]
        public string Statut { get; set; } = "Préparation";

        // Suivi de paiement manuel par l'admin : pas de passerelle de paiement réelle,
        // juste un indicateur "réglé / pas encore réglé" saisi côté back-office.
        [Required]
        [Column("est_paye")]
        public bool EstPaye { get; set; }

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; }
    }
}
