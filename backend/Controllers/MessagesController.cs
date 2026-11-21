using backend.Controllers.Common;
using backend.Dtos.Message;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/messages")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly IConversationService _conversationService;

        public MessagesController(IMessageService messageService, IConversationService conversationService)
        {
            _messageService = messageService;
            _conversationService = conversationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MessageDto>>> GetByConversation([FromQuery] Guid conversationId)
        {
            if (!await EstProprietaireOuAdmin(conversationId)) return Forbid();

            return Ok(await _messageService.GetByConversationIdAsync(conversationId));
        }

        [HttpPost]
        public async Task<ActionResult<MessageDto>> Create(CreateMessageDto dto)
        {
            if (!await EstProprietaireOuAdmin(dto.ConversationId)) return Forbid();

            // Le sender est déduit du rôle du token, jamais du corps de la requête.
            var sender = this.IsAdmin() ? "admin" : "client";

            var message = await _messageService.CreateAsync(dto, sender);
            return CreatedAtAction(nameof(GetByConversation), new { conversationId = message.ConversationId }, message);
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<MessageDto>> Update(Guid id, UpdateMessageDto dto)
        {
            var message = await _messageService.GetByIdAsync(id);
            if (message is null) return NotFound();
            if (!await EstProprietaireOuAdmin(message.ConversationId)) return Forbid();

            var sender = this.IsAdmin() ? "admin" : "client";
            if (message.Sender != sender) return Forbid();

            var updated = await _messageService.UpdateContenuAsync(id, dto.Contenu);
            return updated is null ? NotFound() : Ok(updated);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var message = await _messageService.GetByIdAsync(id);
            if (message is null) return NotFound();
            if (!await EstProprietaireOuAdmin(message.ConversationId)) return Forbid();

            var sender = this.IsAdmin() ? "admin" : "client";
            if (message.Sender != sender) return Forbid();

            return await _messageService.DeleteAsync(id) ? NoContent() : NotFound();
        }

        [HttpPatch("{id:guid}/lu")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var message = await _messageService.GetByIdAsync(id);
            if (message is null) return NotFound();

            if (!await EstProprietaireOuAdmin(message.ConversationId)) return Forbid();

            // "Lu" signifie "lu par le destinataire" : marquer son propre message comme lu
            // fausserait le compteur de non-lus de l'autre partie. On l'ignore silencieusement.
            var monRole = this.IsAdmin() ? "admin" : "client";
            if (message.Sender == monRole) return NoContent();

            var updated = await _messageService.MarkAsReadAsync(id);
            return updated ? NoContent() : NotFound();
        }

        // Une conversation n'appartient qu'à un seul client : on vérifie que l'appelant en est
        // le propriétaire (ou un Admin) avant de laisser lire/écrire ses messages.
        private async Task<bool> EstProprietaireOuAdmin(Guid conversationId)
        {
            if (this.IsAdmin()) return true;

            var conversation = await _conversationService.GetByIdAsync(conversationId);
            return conversation is not null && conversation.ClientId == this.GetUserId();
        }
    }
}
