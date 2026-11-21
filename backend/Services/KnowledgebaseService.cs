using backend.Data;
using backend.Dtos.Knowledgebase;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class KnowledgebaseService : IKnowledgebaseService
    {
        private readonly AppDbContext _context;

        public KnowledgebaseService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<KnowledgebaseDto>> GetAllAsync()
        {
            return await _context.Knowledgebases
                .OrderByDescending(k => k.CreatedAt)
                .Select(k => ToDto(k))
                .ToListAsync();
        }

        public async Task<KnowledgebaseDto?> GetByIdAsync(Guid id)
        {
            var entry = await _context.Knowledgebases.FindAsync(id);
            return entry is null ? null : ToDto(entry);
        }

        public async Task<KnowledgebaseDto> CreateAsync(CreateKnowledgebaseDto dto)
        {
            var entry = new Knowledgebase
            {
                Id = Guid.NewGuid(),
                Titre = dto.Titre,
                Contenu = dto.Contenu,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.Knowledgebases.Add(entry);
            await _context.SaveChangesAsync();

            return ToDto(entry);
        }

        public async Task<KnowledgebaseDto?> UpdateAsync(Guid id, UpdateKnowledgebaseDto dto)
        {
            var entry = await _context.Knowledgebases.FindAsync(id);
            if (entry is null) return null;

            entry.Titre = dto.Titre;
            entry.Contenu = dto.Contenu;

            await _context.SaveChangesAsync();

            return ToDto(entry);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var entry = await _context.Knowledgebases.FindAsync(id);
            if (entry is null) return false;

            _context.Knowledgebases.Remove(entry);
            await _context.SaveChangesAsync();

            return true;
        }

        private static KnowledgebaseDto ToDto(Knowledgebase k) => new()
        {
            Id = k.Id,
            Titre = k.Titre,
            Contenu = k.Contenu,
            CreatedAt = k.CreatedAt
        };
    }
}
