using System.Text.Json;
using backend.Interfaces;
using backend.Services.Exceptions;

namespace backend.Services
{
    // Vérifie les jetons Google / Facebook obtenus par le navigateur. On ne fait JAMAIS confiance
    // à un email envoyé par le front : l'identité est relue auprès du fournisseur, et on vérifie
    // que le jeton a bien été émis pour NOTRE application (sinon le jeton d'un autre site, obtenu
    // par un tiers malveillant, suffirait à se connecter au compte de sa victime).
    public class ExternalAuthService : IExternalAuthService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ExternalAuthService> _logger;

        public ExternalAuthService(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<ExternalAuthService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<ProfilExterne> VerifierGoogleAsync(string accessToken)
        {
            var clientId = _configuration["Authentication:Google:ClientId"];
            if (string.IsNullOrWhiteSpace(clientId))
            {
                throw new ServiceUnavailableException("La connexion Google n'est pas configurée sur le serveur.");
            }

            var http = _httpClientFactory.CreateClient();

            // 1. Le jeton est-il valide, et destiné à notre client OAuth ?
            var tokenInfo = await LireJsonAsync(http,
                $"https://oauth2.googleapis.com/tokeninfo?access_token={Uri.EscapeDataString(accessToken)}",
                "Google");
            if (Lire(tokenInfo, "aud") != clientId)
            {
                throw new UnauthorizedAppException("Jeton Google invalide pour cette application.");
            }

            // 2. Profil de l'utilisateur.
            using var requete = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
            requete.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            var profil = await EnvoyerJsonAsync(http, requete, "Google");

            var email = Lire(profil, "email");
            var emailVerifie = profil.TryGetProperty("email_verified", out var v) &&
                (v.ValueKind == JsonValueKind.True || (v.ValueKind == JsonValueKind.String && v.GetString() == "true"));
            if (string.IsNullOrWhiteSpace(email) || !emailVerifie)
            {
                throw new BadRequestException("Votre compte Google n'a pas d'adresse email vérifiée.");
            }

            return new ProfilExterne(email, Lire(profil, "given_name") ?? string.Empty, Lire(profil, "family_name") ?? string.Empty);
        }

        public async Task<ProfilExterne> VerifierFacebookAsync(string accessToken)
        {
            var appId = _configuration["Authentication:Facebook:AppId"];
            var appSecret = _configuration["Authentication:Facebook:AppSecret"];
            if (string.IsNullOrWhiteSpace(appId) || string.IsNullOrWhiteSpace(appSecret))
            {
                throw new ServiceUnavailableException("La connexion Facebook n'est pas configurée sur le serveur.");
            }

            var http = _httpClientFactory.CreateClient();

            // 1. debug_token (avec le jeton d'application) : valide, et émis pour NOTRE app ?
            var debug = await LireJsonAsync(http,
                "https://graph.facebook.com/debug_token" +
                $"?input_token={Uri.EscapeDataString(accessToken)}" +
                $"&access_token={Uri.EscapeDataString($"{appId}|{appSecret}")}",
                "Facebook");
            if (!debug.TryGetProperty("data", out var data) ||
                !data.TryGetProperty("is_valid", out var valide) || valide.ValueKind != JsonValueKind.True ||
                Lire(data, "app_id") != appId)
            {
                throw new UnauthorizedAppException("Jeton Facebook invalide pour cette application.");
            }

            // 2. Profil. Facebook ne renvoie "email" que si l'adresse est confirmée et que
            //    l'utilisateur a accepté de la partager.
            var profil = await LireJsonAsync(http,
                $"https://graph.facebook.com/me?fields=email,first_name,last_name&access_token={Uri.EscapeDataString(accessToken)}",
                "Facebook");

            var email = Lire(profil, "email");
            if (string.IsNullOrWhiteSpace(email))
            {
                throw new BadRequestException(
                    "Votre compte Facebook ne partage pas d'adresse email. Autorisez l'accès à l'email ou inscrivez-vous avec un mot de passe.");
            }

            return new ProfilExterne(email, Lire(profil, "first_name") ?? string.Empty, Lire(profil, "last_name") ?? string.Empty);
        }

        private Task<JsonElement> LireJsonAsync(HttpClient http, string url, string fournisseur) =>
            EnvoyerJsonAsync(http, new HttpRequestMessage(HttpMethod.Get, url), fournisseur);

        private async Task<JsonElement> EnvoyerJsonAsync(HttpClient http, HttpRequestMessage requete, string fournisseur)
        {
            HttpResponseMessage reponse;
            try
            {
                reponse = await http.SendAsync(requete);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning(ex, "{Fournisseur} injoignable", fournisseur);
                throw new ServiceUnavailableException($"{fournisseur} est injoignable pour le moment, réessayez plus tard.");
            }

            using (reponse)
            {
                if (!reponse.IsSuccessStatusCode)
                {
                    // Jeton expiré, révoqué ou forgé : le fournisseur répond 400/401.
                    throw new UnauthorizedAppException($"Connexion {fournisseur} refusée ou expirée, veuillez réessayer.");
                }

                await using var flux = await reponse.Content.ReadAsStreamAsync();
                using var document = await JsonDocument.ParseAsync(flux);
                return document.RootElement.Clone();
            }
        }

        private static string? Lire(JsonElement element, string propriete) =>
            element.TryGetProperty(propriete, out var valeur) && valeur.ValueKind == JsonValueKind.String
                ? valeur.GetString()
                : null;
    }
}
