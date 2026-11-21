using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Newsletter
{
    public class CreateAbonneNewsletterDto
    {
        [Required, EmailAddress, StringLength(254)]
        public string Email { get; set; } = string.Empty;
    }

    public class AbonneNewsletterDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class EnvoyerNewsletterDto
    {
        [Required, StringLength(180, MinimumLength = 3)]
        public string Sujet { get; set; } = string.Empty;

        [Required, StringLength(10000, MinimumLength = 2)]
        public string Contenu { get; set; } = string.Empty;
    }
}
