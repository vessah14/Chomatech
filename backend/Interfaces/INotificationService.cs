using backend.Dtos.Notification;

namespace backend.Interfaces
{
    public interface INotificationService
    {
        Task<IEnumerable<NotificationDto>> GetAllAsync();
        Task<IEnumerable<NotificationDto>> GetByClientIdAsync(Guid clientId);
        Task<NotificationDto?> GetByIdAsync(Guid id);

        // Renvoie plusieurs notifications quand dto.ClientId est null (diffusion à tous les
        // clients) : une ligne indépendante par destinataire, jamais un état "Lu" partagé.
        Task<IEnumerable<NotificationDto>> CreateAsync(CreateNotificationDto dto);

        Task<bool> MarkAsReadAsync(Guid id);
        Task<bool> DeleteAsync(Guid id);
    }
}
