using backend.Data;
using backend.Dtos.MessageContact;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class MessageContactService : IMessageContactService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IParametreService _parametreService;

        public MessageContactService(AppDbContext context, IEmailService emailService, IParametreService parametreService)
        {
            _context = context;
            _emailService = emailService;
            _parametreService = parametreService;
        }

        public async Task<IEnumerable<MessageContactDto>> GetAllAsync()
        {
            return await _context.MessagesContact
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => ToDto(m))
                .ToListAsync();
        }

        public async Task<MessageContactDto?> GetByIdAsync(Guid id)
        {
            var message = await _context.MessagesContact.FindAsync(id);
            return message is null ? null : ToDto(message);
        }

        public async Task<MessageContactDto> CreateAsync(CreateMessageContactDto dto)
        {
            var message = new MessageContact
            {
                Id = Guid.NewGuid(),
                NomComplet = dto.NomComplet,
                Email = dto.Email,
                Telephone = dto.Telephone,
                Entreprise = dto.Entreprise,
                ServiceSouhaite = dto.ServiceSouhaite,
                Budget = dto.Budget,
                Message = dto.Message,
                Lu = false,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.MessagesContact.Add(message);
            await _context.SaveChangesAsync();

            // Prévient l'entreprise (email des Paramètres admin) ; "Répondre" écrit au visiteur.
            // Un échec d'envoi n'empêche pas l'enregistrement : le message reste dans l'admin.
            var parametres = await _parametreService.GetAsync();
            await _emailService.EnvoyerAsync(EmailTemplates.NouveauMessageContact(
                parametres.Email, message.NomComplet, message.Email, message.Telephone,
                message.Entreprise, message.ServiceSouhaite, message.Budget, message.Message));

            return ToDto(message);
        }

        public async Task<MessageContactDto?> UpdateStatutAsync(Guid id, UpdateMessageContactStatutDto dto)
        {
            var message = await _context.MessagesContact.FindAsync(id);
            if (message is null) return null;

            message.Lu = dto.Lu;
            await _context.SaveChangesAsync();

            return ToDto(message);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var message = await _context.MessagesContact.FindAsync(id);
            if (message is null) return false;

            _context.MessagesContact.Remove(message);
            await _context.SaveChangesAsync();

            return true;
        }

        private static MessageContactDto ToDto(MessageContact m) => new()
        {
            Id = m.Id,
            NomComplet = m.NomComplet,
            Email = m.Email,
            Telephone = m.Telephone,
            Entreprise = m.Entreprise,
            ServiceSouhaite = m.ServiceSouhaite,
            Budget = m.Budget,
            Message = m.Message,
            Lu = m.Lu,
            CreatedAt = m.CreatedAt
        };
    }
}
