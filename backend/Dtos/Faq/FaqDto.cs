using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Faq
{
    public class CreateFaqDto
    {
        [Required, StringLength(270, MinimumLength = 3)]
        public string Question { get; set; } = string.Empty;

        [Required]
        public string Reponse { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Categorie { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Statut { get; set; } = string.Empty;
    }

    public class UpdateFaqDto
    {
        [Required, StringLength(270, MinimumLength = 3)]
        public string Question { get; set; } = string.Empty;

        [Required]
        public string Reponse { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Categorie { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Statut { get; set; } = string.Empty;
    }

    public class FaqDto
    {
        public Guid Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public string Reponse { get; set; } = string.Empty;
        public string Categorie { get; set; } = string.Empty;
        public string Statut { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
    }
}
