using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.User
{
    public class CreateUtilisateurDtos
    {
        [Required, StringLength(100)]
        public string Nom { get; set; } = string.Empty;

        [Required, StringLength(100)]
        public string Prenom { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, StringLength(100, MinimumLength = 8)]
        public string Password { get; set; } = string.Empty;

        // Optionnel : seul un appel fait par un Admin peut définir "Admin" ici (voir UsersController.Create).
        // Un client qui s'inscrit passe toujours par AuthService.SignupAsync, qui force "Client"
        // et n'expose même pas ce champ.
        [RegularExpression("^(Client|Admin)$")]
        public string Role { get; set; } = "Client";
    }

    public class UpdateUserRoleDto
    {
        [Required, RegularExpression("^(Client|Admin)$")]
        public string Role { get; set; } = string.Empty;
    }

    public class UpdateUtilisateurDtos
    {
        [Required, StringLength(100)]
        public string Nom { get; set; } = string.Empty;

        [Required, StringLength(100)]
        public string Prenom { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class ChangePasswordDto
    {
        [Required]
        public string MotDePasseActuel { get; set; } = string.Empty;

        [Required, StringLength(100, MinimumLength = 8)]
        public string NouveauMotDePasse { get; set; } = string.Empty;
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string Prenom { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "Client";
        public DateTimeOffset CreatedAt { get; set; }
    }
}