using backend.Data;
using backend.Dtos.Service;
using backend.Interfaces;
using backend.Services.Exceptions;
using Microsoft.EntityFrameworkCore;
using ServiceModel = backend.Models.Service;

namespace backend.Services
{
    // Fichier nommé "CatalogueServiceService" (plutôt que "ServiceService.cs") uniquement pour
    // rester lisible dans l'arborescence — la classe elle-même s'appelle bien ServiceService,
    // conforme à IServiceService.
    public class ServiceService : IServiceService
    {
        private readonly AppDbContext _context;

        public ServiceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ServiceDto>> GetAllAsync()
        {
            return await _context.Services
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => ToDto(s))
                .ToListAsync();
        }

        public async Task<ServiceDto?> GetByIdAsync(Guid id)
        {
            var service = await _context.Services.FindAsync(id);
            return service is null ? null : ToDto(service);
        }

        public async Task<ServiceDto> CreateAsync(CreateServiceDto dto)
        {
            var service = new ServiceModel
            {
                Id = Guid.NewGuid(),
                NomService = dto.NomService,
                Categorie = dto.Categorie,
                Description = dto.Description,
                Montant = dto.Montant,
                Statut = dto.Statut,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.Services.Add(service);
            await _context.SaveChangesAsync();

            return ToDto(service);
        }

        public async Task<ServiceDto?> UpdateAsync(Guid id, UpdateServiceDto dto)
        {
            var service = await _context.Services.FindAsync(id);
            if (service is null) return null;

            service.NomService = dto.NomService;
            service.Categorie = dto.Categorie;
            service.Description = dto.Description;
            service.Montant = dto.Montant;
            service.Statut = dto.Statut;

            await _context.SaveChangesAsync();

            return ToDto(service);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var service = await _context.Services.FindAsync(id);
            if (service is null) return false;

            _context.Services.Remove(service);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                throw new ConflictException("Ce service a encore des demandes associées et ne peut pas être supprimé.");
            }

            return true;
        }

        private static ServiceDto ToDto(ServiceModel s) => new()
        {
            Id = s.Id,
            NomService = s.NomService,
            Categorie = s.Categorie,
            Description = s.Description,
            Montant = s.Montant,
            Statut = s.Statut,
            CreatedAt = s.CreatedAt
        };
    }
}
