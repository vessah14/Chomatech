using System.Net.Http.Json;
using backend.Interfaces;

namespace backend.Services
{
    // Intégration Brevo (ex-Sendinblue), API v3 :
    //  - emails transactionnels : POST /v3/smtp/email
    //  - liste newsletter       : POST /v3/contacts, POST /v3/contacts/lists/{id}/contacts/remove
    //
    // Configuration (section "Brevo") : ApiKey (SECRET : user-secrets / variable Brevo__ApiKey),
    // SenderEmail (adresse d'un expéditeur validé dans Brevo), SenderName, NewsletterListId.
    //
    // Sans ApiKey : rien n'est envoyé. En Development, le contenu des emails est écrit dans la
    // console (pour tester "mot de passe oublié" sans compte Brevo) ; en production, un
    // avertissement est journalisé, sans le contenu (il peut contenir un lien de réinitialisation).
    public class BrevoService : IEmailService, INewsletterSync
    {
        public const string HttpClientName = "brevo";

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly IHostEnvironment _environment;
        private readonly ILogger<BrevoService> _logger;

        public BrevoService(IHttpClientFactory httpClientFactory, IConfiguration configuration, IHostEnvironment environment, ILogger<BrevoService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _environment = environment;
            _logger = logger;
        }

        private string? ApiKey => _configuration["Brevo:ApiKey"];
        private bool Configure => !string.IsNullOrWhiteSpace(ApiKey);

        public async Task<bool> EnvoyerAsync(EmailMessage message)
        {
            var expediteurEmail = _configuration["Brevo:SenderEmail"];

            if (!Configure || string.IsNullOrWhiteSpace(expediteurEmail))
            {
                if (_environment.IsDevelopment())
                {
                    _logger.LogInformation(
                        "[Brevo non configuré — email NON envoyé]\nÀ : {Destinataire}\nSujet : {Sujet}\n{Texte}",
                        message.DestinataireEmail, message.Sujet, message.Texte);
                }
                else
                {
                    _logger.LogWarning("Brevo non configuré (Brevo:ApiKey / Brevo:SenderEmail) : email \"{Sujet}\" non envoyé.", message.Sujet);
                }
                return false;
            }

            var corps = new
            {
                sender = new { email = expediteurEmail, name = _configuration["Brevo:SenderName"] ?? "CHOMA TECH" },
                to = new[] { new { email = message.DestinataireEmail, name = message.DestinataireNom } },
                replyTo = message.RepondreA is null ? null : new { email = message.RepondreA },
                subject = message.Sujet,
                htmlContent = message.Html,
                textContent = message.Texte
            };

            var envoye = await AppelerAsync(HttpMethod.Post, "smtp/email", corps, $"email \"{message.Sujet}\"");
            return envoye;
        }

        public async Task AjouterAsync(string email)
        {
            if (!ListeNewsletter(out var listId)) return;

            // updateEnabled : si le contact existe déjà dans Brevo, on l'ajoute simplement à la liste.
            await AppelerAsync(HttpMethod.Post, "contacts",
                new { email, listIds = new[] { listId }, updateEnabled = true },
                "ajout à la liste newsletter");
        }

        public async Task RetirerAsync(string email)
        {
            if (!ListeNewsletter(out var listId)) return;

            await AppelerAsync(HttpMethod.Post, $"contacts/lists/{listId}/contacts/remove",
                new { emails = new[] { email } },
                "retrait de la liste newsletter");
        }

        private bool ListeNewsletter(out long listId)
        {
            listId = _configuration.GetValue<long?>("Brevo:NewsletterListId") ?? 0;
            return Configure && listId > 0;
        }

        private async Task<bool> AppelerAsync(HttpMethod methode, string chemin, object corps, string action)
        {
            try
            {
                var http = _httpClientFactory.CreateClient(HttpClientName);
                using var requete = new HttpRequestMessage(methode, chemin) { Content = JsonContent.Create(corps) };
                requete.Headers.Add("api-key", ApiKey);

                using var reponse = await http.SendAsync(requete);
                if (reponse.IsSuccessStatusCode) return true;

                // Le corps d'erreur Brevo explique la cause (clé invalide, expéditeur non validé...).
                var detail = await reponse.Content.ReadAsStringAsync();
                _logger.LogError("Brevo a refusé : {Action} (HTTP {Code}) : {Detail}", action, (int)reponse.StatusCode, detail);
                return false;
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                _logger.LogError(ex, "Brevo injoignable : {Action}", action);
                return false;
            }
        }
    }
}
