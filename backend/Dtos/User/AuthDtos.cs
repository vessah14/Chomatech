using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.User
{
    public class LoginDto
    {
        [Required,EmailAddress]
        public string Email{get;set;} = string.Empty;

        [Required]
        public string Password{get;set;} = string.Empty;

        // "Se souvenir de moi" : jeton longue durée (Jwt:RememberMeDays) au lieu de Jwt:ExpiresMinutes.
        public bool RememberMe { get; set; }
    }

    // Connexion Google / Facebook : jeton d'accès obtenu côté navigateur auprès du fournisseur,
    // re-vérifié côté serveur auprès de ce même fournisseur avant toute connexion.
    public class SocialLoginDto
    {
        [Required, StringLength(4096)]
        public string AccessToken { get; set; } = string.Empty;

        public bool RememberMe { get; set; }
    }

    public class LoginResponseDto
    {
        // Jamais renvoyé dans le JSON : le jeton part uniquement dans le cookie HttpOnly
        // (AuthCookies), hors de portée du JavaScript des fronts.
        [JsonIgnore]
        public string Token {get;set;} = string.Empty;

        // Cookie persistant ("se souvenir de moi") ou cookie de session.
        [JsonIgnore]
        public bool Persistant { get; set; }

        public DateTimeOffset Expiration{get;set;}
        public UserDto? Utilisateur { get; set; }
    }

    public class SignupDto
    {
        [Required, StringLength(100)]
        public string Nom {get; set;} = string.Empty;

        [Required, StringLength(100)]
        public string Prenom {get;set;} = string.Empty;

        [Required,EmailAddress]
        public string Email{get;set;} = string.Empty;

        [Required, StringLength(100, MinimumLength = 8)]
        public string Password{get;set;} = string.Empty;
    }

    public class DemanderResetPasswordDto
    {
        [Required,EmailAddress]
        public string Email {get; set;} = string.Empty;
    }
    
    public class ResetPasswordDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        [Required, MinLength(8)]
        public string NewPassword { get; set; } = string.Empty;

        [Required, Compare(nameof(NewPassword))]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}