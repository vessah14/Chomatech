namespace backend.Interfaces
{
    // Identité renvoyée par un fournisseur externe après vérification de son jeton.
    public record ProfilExterne(string Email, string Prenom, string Nom);

    public interface IExternalAuthService
    {
        Task<ProfilExterne> VerifierGoogleAsync(string accessToken);
        Task<ProfilExterne> VerifierFacebookAsync(string accessToken);
    }
}
