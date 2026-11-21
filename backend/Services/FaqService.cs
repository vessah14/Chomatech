using backend.Data;
using backend.Dtos.Faq;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class FaqService : IFaqService
    {
        private readonly AppDbContext _context;

        public FaqService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<FaqDto>> GetAllAsync()
        {
            return await _context.Faqs
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => ToDto(f))
                .ToListAsync();
        }

        public async Task<FaqDto?> GetByIdAsync(Guid id)
        {
            var faq = await _context.Faqs.FindAsync(id);
            return faq is null ? null : ToDto(faq);
        }

        public async Task<FaqDto> CreateAsync(CreateFaqDto dto)
        {
            var faq = new Faq
            {
                Id = Guid.NewGuid(),
                Question = dto.Question,
                Reponse = dto.Reponse,
                Categorie = dto.Categorie,
                Statut = dto.Statut,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.Faqs.Add(faq);
            await _context.SaveChangesAsync();

            return ToDto(faq);
        }

        public async Task<FaqDto?> UpdateAsync(Guid id, UpdateFaqDto dto)
        {
            var faq = await _context.Faqs.FindAsync(id);
            if (faq is null) return null;

            faq.Question = dto.Question;
            faq.Reponse = dto.Reponse;
            faq.Categorie = dto.Categorie;
            faq.Statut = dto.Statut;

            await _context.SaveChangesAsync();

            return ToDto(faq);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var faq = await _context.Faqs.FindAsync(id);
            if (faq is null) return false;

            _context.Faqs.Remove(faq);
            await _context.SaveChangesAsync();

            return true;
        }

        private static FaqDto ToDto(Faq f) => new()
        {
            Id = f.Id,
            Question = f.Question,
            Reponse = f.Reponse,
            Categorie = f.Categorie,
            Statut = f.Statut,
            CreatedAt = f.CreatedAt
        };
    }
}
