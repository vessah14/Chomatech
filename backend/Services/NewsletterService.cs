using backend.Data;
using backend.Dtos.Newsletter;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace backend.Services
{
    public class NewsletterService : INewsletterService
    {
        private readonly AppDbContext _context;
        private readonly INewsletterSync _sync;
        private readonly IEmailService _emailService;
        private readonly ILogger<NewsletterService> _logger;

        public NewsletterService(AppDbContext context, INewsletterSync sync, IEmailService emailService, ILogger<NewsletterService> logger)
        {
            _context = context;
            _sync = sync;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<IEnumerable<AbonneNewsletterDto>> GetAllAsync()
        {
            return await _context.AbonnesNewsletter
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => ToDto(a))
                .ToListAsync();
        }

        public async Task InscrireAsync(CreateAbonneNewsletterDto dto)
        {
            var email = dto.Email.Trim();

            // Idempotent : un email déjà inscrit ne lève pas d'erreur, pour ne pas révéler
            // à un visiteur anonyme quelles adresses figurent déjà dans la liste.
            var dejaInscrit = await _context.AbonnesNewsletter.AnyAsync(a => a.Email == email);
            if (dejaInscrit) return;

            _context.AbonnesNewsletter.Add(new AbonneNewsletter
            {
                Id = Guid.NewGuid(),
                Email = email,
                CreatedAt = DateTimeOffset.UtcNow
            });

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Deux inscriptions simultanées du même email : l'index unique a rejeté la
                // seconde, l'email est bien inscrit — même issue que le cas "déjà inscrit".
                return;
            }

            // Copie dans la liste Brevo, d'où partent les campagnes. Un échec Brevo est
            // journalisé mais n'annule pas l'inscription (la base reste la référence).
            await _sync.AjouterAsync(email);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var abonne = await _context.AbonnesNewsletter.FindAsync(id);
            if (abonne is null) return false;

            _context.AbonnesNewsletter.Remove(abonne);
            await _context.SaveChangesAsync();

            // Désinscrit aussi côté Brevo, sinon il continuerait à recevoir les campagnes.
            await _sync.RetirerAsync(abonne.Email);

            return true;
        }

        public async Task<int> EnvoyerCampagneAsync(string sujet, string contenu)
        {
            var abonnes = await _context.AbonnesNewsletter.AsNoTracking()
                .Select(a => a.Email).ToListAsync();
            if (abonnes.Count == 0)
                throw new EmailDeliveryException("Aucun abonné actif à qui envoyer cette newsletter.");

            var envoyes = 0;
            foreach (var email in abonnes)
            {
                if (await _emailService.EnvoyerAsync(EmailTemplates.CampagneNewsletter(email, sujet, contenu)))
                    envoyes++;
                else
                    _logger.LogWarning("Echec d'envoi de la newsletter à un abonné.");
            }
            if (envoyes != abonnes.Count)
                throw new EmailDeliveryException($"Envoi incomplet : {envoyes} email(s) accepté(s) sur {abonnes.Count}. Consultez les logs du backend.");
            return envoyes;
        }

        private static AbonneNewsletterDto ToDto(AbonneNewsletter a) => new()
        {
            Id = a.Id,
            Email = a.Email,
            CreatedAt = a.CreatedAt
        };
    }
}
