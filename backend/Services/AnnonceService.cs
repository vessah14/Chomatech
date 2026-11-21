using backend.Data;
using backend.Dtos.Annonce;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace backend.Services
{
    public class AnnonceService : IAnnonceService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AnnonceService> _logger;

        public AnnonceService(AppDbContext context, IEmailService emailService, IConfiguration configuration, ILogger<AnnonceService> logger)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<IEnumerable<AnnonceDto>> GetAllAsync()
        {
            return await _context.Annonces
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => ToDto(a))
                .ToListAsync();
        }

        public async Task<AnnonceDto?> GetByIdAsync(Guid id)
        {
            var annonce = await _context.Annonces.FindAsync(id);
            return annonce is null ? null : ToDto(annonce);
        }

        public async Task<AnnonceDto> CreateAsync(CreateAnnonceDto dto)
        {
            var annonce = new Annonce
            {
                Id = Guid.NewGuid(),
                Titre = dto.Titre,
                Categorie = dto.Categorie,
                Statut = dto.Statut,
                Epingle = dto.Epingle,
                Vues = 0,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.Annonces.Add(annonce);
            await _context.SaveChangesAsync();

            if (EstPubliee(annonce.Statut))
                await NotifierAbonnesAsync(annonce);

            return ToDto(annonce);
        }

        public async Task<AnnonceDto?> UpdateAsync(Guid id, UpdateAnnonceDto dto)
        {
            var annonce = await _context.Annonces.FindAsync(id);
            if (annonce is null) return null;

            var etaitPubliee = EstPubliee(annonce.Statut);

            annonce.Titre = dto.Titre;
            annonce.Categorie = dto.Categorie;
            annonce.Statut = dto.Statut;
            annonce.Epingle = dto.Epingle;

            await _context.SaveChangesAsync();

            if (!etaitPubliee && EstPubliee(annonce.Statut))
                await NotifierAbonnesAsync(annonce);

            return ToDto(annonce);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var annonce = await _context.Annonces.FindAsync(id);
            if (annonce is null) return false;

            _context.Annonces.Remove(annonce);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task IncrementerVuesAsync(Guid id)
        {
            // ExecuteUpdateAsync : incrémentation atomique côté base, évite une course
            // si plusieurs visiteurs consultent l'annonce en même temps.
            await _context.Annonces
                .Where(a => a.Id == id)
                .ExecuteUpdateAsync(setters => setters.SetProperty(a => a.Vues, a => a.Vues + 1));
        }

        private static AnnonceDto ToDto(Annonce a) => new()
        {
            Id = a.Id,
            Titre = a.Titre,
            Categorie = a.Categorie,
            Statut = a.Statut,
            Epingle = a.Epingle,
            Vues = a.Vues,
            CreatedAt = a.CreatedAt
        };

        private static bool EstPubliee(string statut) =>
            string.Equals(statut?.Trim(), "Publiée", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(statut?.Trim(), "Publiee", StringComparison.OrdinalIgnoreCase);

        private async Task NotifierAbonnesAsync(Annonce annonce)
        {
            var destinataires = await _context.AbonnesNewsletter
                .AsNoTracking()
                .Select(a => a.Email)
                .ToListAsync();
            var siteUrl = (_configuration["App:SiteUrl"] ?? "http://localhost:5173").TrimEnd('/');
            var lien = $"{siteUrl}/annonces";

            var echecs = 0;
            foreach (var email in destinataires)
            {
                var envoye = await _emailService.EnvoyerAsync(
                    EmailTemplates.NouvelleAnnonce(email, annonce.Titre, annonce.Categorie, lien));
                if (!envoye)
                {
                    echecs++;
                    _logger.LogWarning("Echec de notification d'annonce à un abonné newsletter (annonce {AnnonceId}).", annonce.Id);
                }
            }

            if (echecs > 0)
                throw new EmailDeliveryException($"Annonce enregistrée, mais {echecs} email(s) de notification n'ont pas été acceptés par Brevo.");
        }
    }
}
