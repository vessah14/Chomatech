using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Produit
{
    public class CreateProduitDto
    {
        [Required, StringLength(250, MinimumLength = 2)]
        public string NomProduit { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Categorie { get; set; } = string.Empty;

        [Required, Range(0.01, double.MaxValue, ErrorMessage = "Le montant doit être supérieur à 0.")]
        public decimal Montant { get; set; }

        [Range(0, int.MaxValue)]
        public int Stock { get; set; }

        public string? Image { get; set; }

        public string? Description { get; set; }

        [Required, StringLength(250)]
        public string Statut { get; set; } = string.Empty;
    }

    public class UpdateProduitDto
    {
        [Required, StringLength(250, MinimumLength = 2)]
        public string NomProduit { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Categorie { get; set; } = string.Empty;

        [Required, Range(0.01, double.MaxValue, ErrorMessage = "Le montant doit être supérieur à 0.")]
        public decimal Montant { get; set; }

        [Range(0, int.MaxValue)]
        public int Stock { get; set; }

        public string? Image { get; set; }

        public string? Description { get; set; }

        [Required, StringLength(250)]
        public string Statut { get; set; } = string.Empty;
    }

    public class ProduitDto
    {
        public Guid Id { get; set; }
        public string NomProduit { get; set; } = string.Empty;
        public string Categorie { get; set; } = string.Empty;
        public decimal Montant { get; set; }
        public int Stock { get; set; }
        public string? Image { get; set; }
        public string? Description { get; set; }
        public string Statut { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
    }
}
