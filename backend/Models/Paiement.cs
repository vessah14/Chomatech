using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Paiement")]
    public class Paiement
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
        [Column("request_key")]
        public Guid RequestKey { get; set; }

        [Column("saspay_checkout_id")]
        public string? SasPayCheckoutId { get; set; }

        [Column("checkout_url")]
        public string? CheckoutUrl { get; set; }

        [Required]
        [Column("montant", TypeName = "numeric(10,2)")]
        public decimal Montant { get; set; }

        [Required]
        [Column("devise")]
        public string Devise { get; set; } = "XAF";

        [Required]
        [Column("statut")]
        public string Statut { get; set; } = "PENDING";

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; }

        public ICollection<DemandeProduit> DemandesProduits { get; set; } = new List<DemandeProduit>();
        public ICollection<DemandeService> DemandesServices { get; set; } = new List<DemandeService>();
    }
}
