using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Service
{
    public class CreateServiceDto
    {
        [Required, StringLength(250, MinimumLength = 2)]
        public string NomService { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Categorie { get; set; } = string.Empty;

        public string? Description { get; set; }

        // Nullable : un service peut être "Sur devis" sans montant fixe.
        [Range(0.01, double.MaxValue, ErrorMessage = "Le montant doit être supérieur à 0.")]
        public decimal? Montant { get; set; }

        [Required, StringLength(250)]
        public string Statut { get; set; } = string.Empty;
    }

    public class UpdateServiceDto
    {
        [Required, StringLength(250, MinimumLength = 2)]
        public string NomService { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Categorie { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Le montant doit être supérieur à 0.")]
        public decimal? Montant { get; set; }

        [Required, StringLength(250)]
        public string Statut { get; set; } = string.Empty;
    }

    public class ServiceDto
    {
        public Guid Id { get; set; }
        public string NomService { get; set; } = string.Empty;
        public string Categorie { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal? Montant { get; set; }
        public string Statut { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
    }
}
