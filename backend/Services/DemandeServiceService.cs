using backend.Data;
using backend.Dtos.DemandeService;
using backend.Interfaces;
using backend.Models;
using backend.Services.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class DemandeServiceService : IDemandeServiceService
    {
        private readonly AppDbContext _context;

        public DemandeServiceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<DemandeServiceDto>> GetAllAsync()
        {
            return await _context.DemandesServices
                .Include(d => d.Client)
                .Include(d => d.Service)
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => ToDto(d))
                .ToListAsync();
        }

        public async Task<IEnumerable<DemandeServiceDto>> GetByClientIdAsync(Guid clientId)
        {
            return await _context.DemandesServices
                .Include(d => d.Client)
                .Include(d => d.Service)
                .Where(d => d.ClientId == clientId)
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => ToDto(d))
                .ToListAsync();
        }

        public async Task<DemandeServiceDto?> GetByIdAsync(Guid id)
        {
            var demande = await _context.DemandesServices
                .Include(d => d.Client)
                .Include(d => d.Service)
                .SingleOrDefaultAsync(d => d.Id == id);

            return demande is null ? null : ToDto(demande);
        }

        public async Task<DemandeServiceDto> CreateAsync(CreateDemandeServiceDto dto)
        {
            var client = await _context.Clients.FindAsync(dto.ClientId)
                ?? throw new NotFoundException("Client introuvable.");

            var service = await _context.Services.FindAsync(dto.ServiceId)
                ?? throw new NotFoundException("Service introuvable.");

            if (service.Statut != "Actif")
            {
                throw new BadRequestException($"Le service \"{service.NomService}\" n'est plus proposé.");
            }

            var demande = new DemandeService
            {
                Id = Guid.NewGuid(),
                ClientId = dto.ClientId,
                ServiceId = dto.ServiceId,
                // Reprend le prix catalogue si fourni par le service ; sinon (ex. "Sur devis"),
                // reste null jusqu'à ce qu'un admin chiffre la demande via UpdateStatutAsync.
                MontantConvenu = dto.MontantConvenu ?? service.Montant,
                Statut = "Validation",
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.DemandesServices.Add(demande);
            await _context.SaveChangesAsync();

            demande.Client = client;
            demande.Service = service;

            return ToDto(demande);
        }

        public async Task<DemandeServiceDto?> UpdateStatutAsync(Guid id, UpdateDemandeServiceStatutDto dto)
        {
            var demande = await _context.DemandesServices
                .Include(d => d.Client)
                .Include(d => d.Service)
                .SingleOrDefaultAsync(d => d.Id == id);

            if (demande is null) return null;

            demande.Statut = dto.Statut;
            if (dto.MontantConvenu.HasValue)
            {
                demande.MontantConvenu = dto.MontantConvenu;
            }

            await _context.SaveChangesAsync();

            return ToDto(demande);
        }

        public async Task<DemandeServiceDto?> UpdatePaiementAsync(Guid id, UpdateDemandeServicePaiementDto dto)
        {
            var demande = await _context.DemandesServices
                .Include(d => d.Client)
                .Include(d => d.Service)
                .SingleOrDefaultAsync(d => d.Id == id);

            if (demande is null) return null;

            demande.EstPaye = dto.EstPaye;
            await _context.SaveChangesAsync();

            return ToDto(demande);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var demande = await _context.DemandesServices.FindAsync(id);
            if (demande is null) return false;

            _context.DemandesServices.Remove(demande);
            await _context.SaveChangesAsync();

            return true;
        }

        private static DemandeServiceDto ToDto(DemandeService d) => new()
        {
            Id = d.Id,
            ClientId = d.ClientId,
            ClientNom = d.Client is null ? string.Empty : $"{d.Client.Prenom} {d.Client.Nom}",
            ServiceId = d.ServiceId,
            NomService = d.Service?.NomService ?? string.Empty,
            MontantConvenu = d.MontantConvenu,
            Statut = d.Statut,
            EstPaye = d.EstPaye,
            CreatedAt = d.CreatedAt
        };
    }
}
