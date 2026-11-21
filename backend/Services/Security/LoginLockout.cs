using backend.Services.Exceptions;
using Microsoft.Extensions.Caching.Memory;

namespace backend.Services.Security
{
    // Verrouillage anti brute-force par email : après MaxEchecs mots de passe faux, l'email est
    // bloqué DureeBlocage. Complète la limite par IP (Program.cs) qui ne suffit pas contre une
    // attaque répartie sur de nombreuses IP. Compté aussi pour les emails inexistants, pour ne pas
    // révéler quels emails ont un compte. En mémoire : suffisant pour une instance unique.
    public class LoginLockout
    {
        private const int MaxEchecs = 5;
        private static readonly TimeSpan DureeBlocage = TimeSpan.FromMinutes(15);

        private readonly IMemoryCache _cache;

        public LoginLockout(IMemoryCache cache)
        {
            _cache = cache;
        }

        private static string Cle(string email) => $"login-echecs:{email.Trim().ToLowerInvariant()}";

        public void VerifierNonBloque(string email)
        {
            if (_cache.TryGetValue(Cle(email), out int echecs) && echecs >= MaxEchecs)
            {
                throw new TooManyRequestsException(
                    "Trop de tentatives de connexion pour ce compte. Réessayez dans 15 minutes.");
            }
        }

        public void EnregistrerEchec(string email)
        {
            var cle = Cle(email);
            var echecs = _cache.TryGetValue(cle, out int n) ? n + 1 : 1;
            // Fenêtre glissante depuis le dernier échec.
            _cache.Set(cle, echecs, DureeBlocage);
        }

        public void Reinitialiser(string email) => _cache.Remove(Cle(email));
    }
}
