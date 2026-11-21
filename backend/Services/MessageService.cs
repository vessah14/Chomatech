using backend.Data;
using backend.Dtos.Message;
using backend.Interfaces;
using backend.Models;
using backend.Services.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class MessageService : IMessageService
    {
        private readonly AppDbContext _context;

        public MessageService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MessageDto>> GetByConversationIdAsync(Guid conversationId)
        {
            return await _context.Messages
                .Where(m => m.ConversationId == conversationId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => ToDto(m))
                .ToListAsync();
        }

        public async Task<MessageDto?> GetByIdAsync(Guid id)
        {
            var message = await _context.Messages.FindAsync(id);
            return message is null ? null : ToDto(message);
        }

        public async Task<MessageDto> CreateAsync(CreateMessageDto dto, string sender)
        {
            var conversationExiste = await _context.Conversations.AnyAsync(c => c.Id == dto.ConversationId);
            if (!conversationExiste)
            {
                throw new NotFoundException("Conversation introuvable.");
            }

            var message = new Message
            {
                Id = Guid.NewGuid(),
                ConversationId = dto.ConversationId,
                Sender = sender,
                Contenu = dto.Contenu,
                Lu = false,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return ToDto(message);
        }

        public async Task<MessageDto?> UpdateContenuAsync(Guid id, string contenu)
        {
            var message = await _context.Messages.FindAsync(id);
            if (message is null) return null;

            message.Contenu = contenu.Trim();
            await _context.SaveChangesAsync();
            return ToDto(message);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var message = await _context.Messages.FindAsync(id);
            if (message is null) return false;

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> MarkAsReadAsync(Guid id)
        {
            var message = await _context.Messages.FindAsync(id);
            if (message is null) return false;

            message.Lu = true;
            await _context.SaveChangesAsync();

            return true;
        }

        private static MessageDto ToDto(Message m) => new()
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
