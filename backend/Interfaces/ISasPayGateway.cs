namespace backend.Interfaces
{
    public interface ISasPayGateway
    {
        Task<SasPayCheckoutSession> CreateCheckoutAsync(
            decimal amount,
            string currency,
            string country,
            string description,
            string customerEmail,
            string customerName,
            string returnUrl,
            Guid paymentId,
            CancellationToken cancellationToken = default);

        Task<SasPayCheckoutStatus> GetCheckoutStatusAsync(
            string checkoutSessionId,
            CancellationToken cancellationToken = default);
    }

    public sealed record SasPayCheckoutSession(string Id, string CheckoutUrl);

    public sealed record SasPayCheckoutStatus(string Status, string? TransactionStatus);
}
