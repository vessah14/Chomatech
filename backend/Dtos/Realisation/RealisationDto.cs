using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Realisation
{
    public class CreateRealisationDto
    {
        [Required, StringLength(250, MinimumLength = 2)]
        public string Titre { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Categorie { get; set; } = string.Empty;

        [Required, StringLength(500)]
        public string Technologies { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Image { get; set; }

        public string? Description { get; set; }

        [Url(ErrorMessage = "Le lien doit être une URL complète (https://...)."), StringLength(500)]
        public string? Lien { get; set; }
    }

    public class UpdateRealisationDto
    {
        [Required, StringLength(250, MinimumLength = 2)]
        public string Titre { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Categorie { get; set; } = string.Empty;

        [Required, StringLength(500)]
        public string Technologies { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Image { get; set; }

        public string? Description { get; set; }

        [Url(ErrorMessage = "Le lien doit être une URL complète (https://...)."), StringLength(500)]
        public string? Lien { get; set; }
    }

    public class RealisationDto
    {
        public Guid Id { get; set; }
        public string Titre { get; set; } = string.Empty;
        public string Categorie { get; set; } = string.Empty;
        public string Technologies { get; set; } = string.Empty;
        public string? Image { get; set; }
        public string? Description { get; set; }
        public string? Lien { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
