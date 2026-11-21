using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Parametre
{
    public class UpdateParametreDto
    {
        [Required, StringLength(150, MinimumLength = 2)]
        public string NomEntreprise { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Slogan { get; set; } = string.Empty;

        [Required, EmailAddress, StringLength(250)]
        public string Email { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string Telephone { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Adresse { get; set; } = string.Empty;
    }

    public class ParametreDto
    {
        public string NomEntreprise { get; set; } = string.Empty;
        public string Slogan { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Telephone { get; set; } = string.Empty;
        public string Adresse { get; set; } = string.Empty;
        public DateTimeOffset UpdatedAt { get; set; }
    }
}
