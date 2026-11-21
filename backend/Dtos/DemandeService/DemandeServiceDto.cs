using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.DemandeService
{
    public class CreateDemandeServiceDto
    {
        [Required]
        public Guid ClientId { get; set; }

        [Required]
        public Guid ServiceId { get; set; }

        // Optionnel : le devis (MontantConvenu) est en général fixé plus tard par l'admin,
        // pas imposé par le client à la création.
        [Range(0.01, double.MaxValue, ErrorMessage = "Le montant doit être supérieur à 0.")]
        public decimal? MontantConvenu { get; set; }
    }

    public class UpdateDemandeServiceStatutDto
    {
        [Required, RegularExpression("^(Validation|En cours|Terminé|Annulée)$",
            ErrorMessage = "Statut invalide (Validation, En cours, Terminé ou Annulée).")]
        public string Statut { get; set; } = string.Empty;

        [Range(0.01, double.MaxValue, ErrorMessage = "Le montant doit être supérieur à 0.")]
        public decimal? MontantConvenu { get; set; }
    }

    public class UpdateDemandeServicePaiementDto
    {
        [Required]
        public bool EstPaye { get; set; }
    }

    public class DemandeServiceDto
    {
        public Guid Id { get; set; }
        public Guid ClientId { get; set; }
        public string ClientNom { get; set; } = string.Empty;
        public Guid ServiceId { get; set; }
        public string NomService { get; set; } = string.Empty;
        public decimal? MontantConvenu { get; set; }
        public string Statut { get; set; } = string.Empty;
        public bool EstPaye { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
