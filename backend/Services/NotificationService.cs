using backend.Data;
using backend.Dtos.Notification;
using backend.Interfaces;
using backend.Models;
using backend.Services.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;

        public NotificationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<NotificationDto>> GetAllAsync()
        {
            return await _context.Notifications
                .Include(n => n.Client)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => ToDto(n))
                .ToListAsync();
        }

        public async Task<IEnumerable<NotificationDto>> GetByClientIdAsync(Guid clientId)
        {
            return await _context.Notifications
                .Include(n => n.Client)
                .Where(n => n.ClientId == clientId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => ToDto(n))
                .ToListAsync();
        }

        public async Task<NotificationDto?> GetByIdAsync(Guid id)
        {
            var notification = await _context.Notifications
                .Include(n => n.Client)
                .SingleOrDefaultAsync(n => n.Id == id);

            return notification is null ? null : ToDto(notification);
        }

        public async Task<IEnumerable<NotificationDto>> CreateAsync(CreateNotificationDto dto)
        {
            if (dto.ClientId.HasValue)
            {
                var client = await _context.Clients.FindAsync(dto.ClientId.Value)
                    ?? throw new NotFoundException("Client introuvable.");

                var notification = NouvelleNotification(dto, client.Id);
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                notification.Client = client;
                return new[] { ToDto(notification) };
            }

            // Diffusion à tous les clients : une ligne indépendante par client, pour que chacun
            // ait son propre état "Lu" (sinon un client qui la lit la marquerait lue pour tous).
            // La table "Client" contient aussi les comptes Admin : on ne diffuse qu'aux vrais clients.
            var clients = await _context.Clients.Where(c => c.Role == "Client").ToListAsync();
            if (clients.Count == 0)
            {
                return Enumerable.Empty<NotificationDto>();
            }

            var notifications = clients.Select(c => NouvelleNotification(dto, c.Id)).ToList();
            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();

            var clientsById = clients.ToDictionary(c => c.Id);
            return notifications.Select(n =>
            {
                n.Client = clientsById[n.ClientId];
                return ToDto(n);
            });
        }

        public async Task<bool> MarkAsReadAsync(Guid id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification is null) return false;

            notification.Lu = true;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification is null) return false;

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return true;
        }

        private static Notification NouvelleNotification(CreateNotificationDto dto, Guid clientId) => new()
        {
            Id = Guid.NewGuid(),
            Titre = dto.Titre,
            Type = dto.Type,
            ClientId = clientId,
            Message = dto.Message,
            Lu = false,
            CreatedAt = DateTimeOffset.UtcNow
        };

        private static NotificationDto ToDto(Notification n) => new()
        {
            Id = n.Id,
            Titre = n.Titre,
            Type = n.Type,
            ClientId = n.ClientId,
            ClientNom = n.Client is null ? string.Empty : $"{n.Client.Prenom} {n.Client.Nom}",
            Message = n.Message,
            Lu = n.Lu,
            CreatedAt = n.CreatedAt
        };
    }
}
