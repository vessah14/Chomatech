using backend.Data;
using backend.Dtos.Conversation;
using backend.Dtos.Message;
using backend.Interfaces;
using backend.Models;
using backend.Services.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class ConversationService : IConversationService
    {
        private readonly AppDbContext _context;

        public ConversationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ConversationDto>> GetAllAsync()
        {
            var conversations = await _context.Conversations
                .Include(c => c.Messages)
                .Include(c => c.Client)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return conversations.Select(ToDto);
        }

        public async Task<IEnumerable<ConversationDto>> GetByClientIdAsync(Guid clientId)
        {
            // Matérialisé (Include + ToListAsync) puis mappé en mémoire : une projection imbriquée
            // (messages dans conversation) appelant une méthode C# n'est pas toujours fiable à
            // traduire côté base par EF Core.
            var conversations = await _context.Conversations
                .Include(c => c.Messages)
                .Include(c => c.Client)
                .Where(c => c.ClientId == clientId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return conversations.Select(ToDto);
        }

        public async Task<ConversationDto?> GetByIdAsync(Guid id)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Messages)
                .Include(c => c.Client)
                .SingleOrDefaultAsync(c => c.Id == id);

            return conversation is null ? null : ToDto(conversation);
        }

        public async Task<ConversationDto> CreateAsync(CreateConversationDto dto)
        {
            var client = await _context.Clients.FindAsync(dto.ClientId)
                ?? throw new NotFoundException("Client introuvable.");

            // Une seule conversation par client (le fil de support) : si elle existe déjà, on la
            // renvoie au lieu d'en créer une seconde. Sans ça, deux ouvertures simultanées de la
            // messagerie (double montage React en dev, deux onglets) créaient des doublons.
            var existante = await _context.Conversations
                .Include(c => c.Messages)
                .Include(c => c.Client)
                .OrderBy(c => c.CreatedAt)
                .FirstOrDefaultAsync(c => c.ClientId == dto.ClientId);
            if (existante is not null) return ToDto(existante);

            var conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                ClientId = dto.ClientId,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();

            conversation.Client = client;
            return ToDto(conversation);
        }

        private static ConversationDto ToDto(Conversation c) => new()
        {
            Id = c.Id,
            ClientId = c.ClientId,
            ClientNom = c.Client is null ? string.Empty : $"{c.Client.Prenom} {c.Client.Nom}",
            CreatedAt = c.CreatedAt,
            Messages = c.Messages
                .OrderBy(m => m.CreatedAt)
                .Select(ToMessageDto)
                .ToList()
        };

        private static MessageDto ToMessageDto(Message m) => new()
        {
            Id = m.Id,
            ConversationId = m.ConversationId,
            Sender = m.Sender,
            Contenu = m.Contenu,
            Lu = m.Lu,
            CreatedAt = m.CreatedAt
        };
    }
}
