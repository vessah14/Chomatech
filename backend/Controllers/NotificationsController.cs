using backend.Controllers.Common;
using backend.Dtos.Notification;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        // Vue globale (Admin) ou notifications d'un client précis (self ou Admin).
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetAll([FromQuery] Guid? clientId)
        {
            if (!clientId.HasValue)
            {
                if (!this.IsAdmin()) return Forbid();
                return Ok(await _notificationService.GetAllAsync());
            }

            if (!this.IsAdmin() && this.GetUserId() != clientId) return Forbid();

            return Ok(await _notificationService.GetByClientIdAsync(clientId.Value));
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<NotificationDto>> GetById(Guid id)
        {
            var notification = await _notificationService.GetByIdAsync(id);
            if (notification is null) return NotFound();

            if (!this.IsAdmin() && this.GetUserId() != notification.ClientId) return Forbid();

            return Ok(notification);
        }

        // Seul un Admin envoie des notifications (diffusion ou individuelle).
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> Create(CreateNotificationDto dto)
        {
            var notifications = await _notificationService.CreateAsync(dto);
            return Ok(notifications);
        }

        [HttpPatch("{id:guid}/lu")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var notification = await _notificationService.GetByIdAsync(id);
            if (notification is null) return NotFound();

            if (!this.IsAdmin() && this.GetUserId() != notification.ClientId) return Forbid();

            var updated = await _notificationService.MarkAsReadAsync(id);
            return updated ? NoContent() : NotFound();
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _notificationService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }
}
