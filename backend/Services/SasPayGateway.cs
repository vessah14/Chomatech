using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Interfaces;

namespace backend.Services
{
    public sealed class SasPayGateway : ISasPayGateway
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public SasPayGateway(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<SasPayCheckoutSession> CreateCheckoutAsync(
            decimal amount,
            string currency,
            string country,
            string description,
            string customerEmail,
            string customerName,
            string returnUrl,
            Guid paymentId,
            CancellationToken cancellationToken = default)
        {
            var apiKey = GetApiKey();
            using var request = CreateRequest(HttpMethod.Post, "checkout-sessions/", apiKey);
            request.Content = JsonContent.Create(new
            {
                amount = amount.ToString("0.00", CultureInfo.InvariantCulture),
                currency,
                country,
                description,
                customer_email = customerEmail,
                customer_name = customerName,
                return_url = returnUrl,
                metadata = new { chomatech_payment_id = paymentId.ToString() }
            });

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            using var document = await ReadResponseAsync(response, cancellationToken);
            var data = document.RootElement.GetProperty("data");
            return new SasPayCheckoutSession(
                data.GetProperty("id").GetString() ?? throw new InvalidOperationException("SasPay n'a pas renvoyé l'identifiant de session."),
                data.GetProperty("checkout_url").GetString() ?? throw new InvalidOperationException("SasPay n'a pas renvoyé l'URL de paiement."));
        }

        public async Task<SasPayCheckoutStatus> GetCheckoutStatusAsync(
            string checkoutSessionId,
            CancellationToken cancellationToken = default)
        {
            using var request = CreateRequest(
                HttpMethod.Get,
                $"checkout-sessions/{Uri.EscapeDataString(checkoutSessionId)}/status/",
                GetApiKey());

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            using var document = await ReadResponseAsync(response, cancellationToken);
            var data = document.RootElement.GetProperty("data");
            return new SasPayCheckoutStatus(
                data.GetProperty("status").GetString() ?? "UNKNOWN",
                data.TryGetProperty("transaction_status", out var transactionStatus)
                    ? transactionStatus.GetString()
                    : null);
        }

        private HttpRequestMessage CreateRequest(HttpMethod method, string path, string apiKey)
        {
            var request = new HttpRequestMessage(method, path);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            return request;
        }

        private string GetApiKey()
        {
            var apiKey = _configuration["SasPay:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new InvalidOperationException("La clé SasPay est absente. Configurez SasPay__ApiKey côté backend.");
            }
            return apiKey;
        }

        private static async Task<JsonDocument> ReadResponseAsync(
            HttpResponseMessage response,
            CancellationToken cancellationToken)
        {
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            JsonDocument document;
            try
            {
                document = JsonDocument.Parse(content);
            }
            catch (JsonException)
            {
                throw new HttpRequestException("Réponse JSON invalide reçue de SasPay.");
            }

            if (!response.IsSuccessStatusCode)
            {
                using (document)
                {
                    var message = document.RootElement.TryGetProperty("error", out var error)
                        && error.TryGetProperty("message", out var errorMessage)
                            ? errorMessage.GetString()
                            : null;
                    throw new HttpRequestException(message ?? $"SasPay a répondu avec le statut {(int)response.StatusCode}.");
                }
            }

            return document;
        }
    }
}
