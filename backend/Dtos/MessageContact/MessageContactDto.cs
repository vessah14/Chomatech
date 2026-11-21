using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.MessageContact
{
    public class CreateMessageContactDto
    {
        [Required, StringLength(150, MinimumLength = 2)]
        public string NomComplet { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [StringLength(50)]
        public string? Telephone { get; set; }

        [StringLength(150)]
        public string? Entreprise { get; set; }

        [StringLength(250)]
        public string? ServiceSouhaite { get; set; }

        [StringLength(250)]
        public string? Budget { get; set; }

        [Required, StringLength(3000, MinimumLength = 5)]
        public string Message { get; set; } = string.Empty;
    }

    public class UpdateMessageContactStatutDto
    {
        [Required]
        public bool Lu { get; set; }
    }

    public class MessageContactDto
    {
        public Guid Id { get; set; }
        public string NomComplet { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Telephone { get; set; }
        public string? Entreprise { get; set; }
        public string? ServiceSouhaite { get; set; }
        public string? Budget { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool Lu { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
