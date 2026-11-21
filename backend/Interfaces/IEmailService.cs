namespace backend.Interfaces
{
    public record EmailMessage(string DestinataireEmail, string DestinataireNom, string Sujet, string Html, string Texte, string? RepondreA = null);

    // Envoi d'emails transactionnels (implémenté par BrevoService). Ne lève jamais d'exception :
    // un email non parti ne doit pas faire échouer l'action de l'utilisateur ; renvoie false.
    public interface IEmailService
    {
        Task<bool> EnvoyerAsync(EmailMessage message);
    }

    public class EmailDeliveryException : Exception
    {
        public EmailDeliveryException(string message) : base(message) { }
    }

    // Liste de contacts newsletter côté Brevo, depuis laquelle l'admin envoie ses campagnes.
    public interface INewsletterSync
    {
        Task AjouterAsync(string email);
        Task RetirerAsync(string email);
    }
}
