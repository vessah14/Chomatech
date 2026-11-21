using System.Net.Http.Json;
using System.Text.Json;

namespace backend.Tests
{
    // Simule un navigateur sur un des deux fronts : envoie l'en-tête X-Chomatech-App et rejoue le
    // cookie de session reçu. Le cookie est exposé pour pouvoir vérifier ses attributs ou le
    // "voler" (le rejouer après révocation).
    public class ApiSession
    {
        private readonly HttpClient _http;
        private readonly string _app;

        public string? Cookie { get; set; }
        public string? DernierSetCookie { get; private set; }

        public ApiSession(HttpClient http, string app)
        {
            _http = http;
            _app = app;
        }

        public Task<HttpResponseMessage> GetAsync(string url) => EnvoyerAsync(HttpMethod.Get, url, null);
        public Task<HttpResponseMessage> PostAsync(string url, object? corps = null) => EnvoyerAsync(HttpMethod.Post, url, corps);
        public Task<HttpResponseMessage> PutAsync(string url, object? corps = null) => EnvoyerAsync(HttpMethod.Put, url, corps);
        public Task<HttpResponseMessage> PatchAsync(string url, object? corps = null) => EnvoyerAsync(HttpMethod.Patch, url, corps);
        public Task<HttpResponseMessage> DeleteAsync(string url) => EnvoyerAsync(HttpMethod.Delete, url, null);

        public async Task<HttpResponseMessage> EnvoyerAsync(HttpMethod methode, string url, object? corps, HttpContent? contenu = null, bool sansEnTeteApp = false)
        {
            using var requete = new HttpRequestMessage(methode, url);
            if (!sansEnTeteApp) requete.Headers.Add("X-Chomatech-App", _app);
            if (Cookie is not null) requete.Headers.Add("Cookie", Cookie);
            requete.Content = contenu ?? (corps is null ? null : JsonContent.Create(corps));

            var reponse = await _http.SendAsync(requete);

            if (reponse.Headers.TryGetValues("Set-Cookie", out var valeurs))
            {
                DernierSetCookie = valeurs.First();
                var paire = DernierSetCookie.Split(';')[0];
                // Cookie vidé par /logout : on l'oublie, sinon on garde le nouveau.
                Cookie = paire.EndsWith('=') ? null : paire;
            }

            return reponse;
        }

        public static async Task<JsonElement> JsonAsync(HttpResponseMessage reponse) =>
            JsonDocument.Parse(await reponse.Content.ReadAsStringAsync()).RootElement;
    }
}
