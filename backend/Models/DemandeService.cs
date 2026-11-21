using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Demande_Service")]
    public class DemandeService
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
        [Column("service_id")]
        public Guid ServiceId { get; set; }

        [ForeignKey(nameof(ServiceId))]
        public Service? Service { get; set; }

        [Column("paiement_id")]
        public Guid? PaiementId { get; set; }

        [ForeignKey(nameof(PaiementId))]
        public Paiement? Paiement { get; set; }

        // Montant négocié/devis pour cette demande précise ; nullable tant que non chiffré.
        [Column("montant_convenu", TypeName = "decimal(10,2)")]
        public decimal? MontantConvenu { get; set; }

        [Required]
        [Column("statut")]
        public string Statut { get; set; } = "Validation";

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
