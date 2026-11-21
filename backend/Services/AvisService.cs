using backend.Data;
using backend.Dtos.Avis;
using backend.Interfaces;
using backend.Models;
using backend.Services.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class AvisService : IAvisService
    {
        private readonly AppDbContext _context;

        public AvisService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<AvisDto>> GetAllAsync()
        {
            return await _context.Avis
                .Include(a => a.Client)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => ToDto(a))
                .ToListAsync();
        }

        // Public (page d'accueil) : uniquement les avis validés par un admin, jamais les
        // commentaires "En attente" qui n'ont pas encore été modérés.
        public async Task<IEnumerable<AvisDto>> GetPublieesAsync()
        {
            return await _context.Avis
                .Include(a => a.Client)
                .Where(a => a.Statut == "Publiée")
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => ToDto(a))
                .ToListAsync();
        }

        public async Task<IEnumerable<AvisDto>> GetByClientIdAsync(Guid clientId)
        {
            return await _context.Avis
                .Include(a => a.Client)
                .Where(a => a.ClientId == clientId)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => ToDto(a))
                .ToListAsync();
        }

        public async Task<AvisDto?> GetByIdAsync(Guid id)
        {
            var avis = await _context.Avis
                .Include(a => a.Client)
                .SingleOrDefaultAsync(a => a.Id == id);

            return avis is null ? null : ToDto(avis);
        }

        public async Task<AvisDto> CreateAsync(Guid clientId, CreateAvisDto dto)
        {
            var client = await _context.Clients.FindAsync(clientId)
                ?? throw new NotFoundException("Client introuvable.");

            var avis = new Avis
            {
                Id = Guid.NewGuid(),
                ClientId = clientId,
                Note = dto.Note,
                Commentaire = dto.Commentaire,
                Statut = "En attente",
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.Avis.Add(avis);
            await _context.SaveChangesAsync();

            avis.Client = client;
            return ToDto(avis);
        }

        public async Task<AvisDto?> UpdateStatutAsync(Guid id, UpdateAvisStatutDto dto)
        {
            var avis = await _context.Avis
                .Include(a => a.Client)
                .SingleOrDefaultAsync(a => a.Id == id);

            if (avis is null) return null;

            avis.Statut = dto.Statut;
            await _context.SaveChangesAsync();

            return ToDto(avis);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var avis = await _context.Avis.FindAsync(id);
            if (avis is null) return false;

            _context.Avis.Remove(avis);
            await _context.SaveChangesAsync();

            return true;
        }

        private static AvisDto ToDto(Avis a) => new()
        {
            Id = a.Id,
            ClientId = a.ClientId,
            ClientNom = a.Client is null ? string.Empty : $"{a.Client.Prenom} {a.Client.Nom}",
            Note = a.Note,
            Commentaire = a.Commentaire,
            Statut = a.Statut,
            CreatedAt = a.CreatedAt
        };
    }
}
