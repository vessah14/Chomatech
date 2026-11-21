using backend.Data;
using backend.Dtos.Realisation;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class RealisationService : IRealisationService
    {
        private readonly AppDbContext _context;

        public RealisationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RealisationDto>> GetAllAsync()
        {
            return await _context.Realisations
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => ToDto(r))
                .ToListAsync();
        }

        public async Task<RealisationDto?> GetByIdAsync(Guid id)
        {
            var realisation = await _context.Realisations.FindAsync(id);
            return realisation is null ? null : ToDto(realisation);
        }

        public async Task<RealisationDto> CreateAsync(CreateRealisationDto dto)
        {
            var realisation = new Realisation
            {
                Id = Guid.NewGuid(),
                Titre = dto.Titre,
                Categorie = dto.Categorie,
                Technologies = dto.Technologies,
                Image = dto.Image,
                Description = dto.Description,
                Lien = dto.Lien,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.Realisations.Add(realisation);
            await _context.SaveChangesAsync();

            return ToDto(realisation);
        }

        public async Task<RealisationDto?> UpdateAsync(Guid id, UpdateRealisationDto dto)
        {
            var realisation = await _context.Realisations.FindAsync(id);
            if (realisation is null) return null;

            realisation.Titre = dto.Titre;
            realisation.Categorie = dto.Categorie;
            realisation.Technologies = dto.Technologies;
            realisation.Image = dto.Image;
            realisation.Description = dto.Description;
            realisation.Lien = dto.Lien;

            await _context.SaveChangesAsync();

            return ToDto(realisation);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var realisation = await _context.Realisations.FindAsync(id);
            if (realisation is null) return false;

            _context.Realisations.Remove(realisation);
            await _context.SaveChangesAsync();

            return true;
        }

        private static RealisationDto ToDto(Realisation r) => new()
        {
            Id = r.Id,
            Titre = r.Titre,
            Categorie = r.Categorie,
            Technologies = r.Technologies,
            Image = r.Image,
            Description = r.Description,
            Lien = r.Lien,
            CreatedAt = r.CreatedAt
        };
    }
}
