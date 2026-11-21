using backend.Controllers.Common;
using backend.Dtos.Conversation;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/conversations")]
    [Authorize]
    public class ConversationsController : ControllerBase
    {
        private readonly IConversationService _conversationService;

        public ConversationsController(IConversationService conversationService)
        {
            _conversationService = conversationService;
        }

        // Toutes les conversations (Admin) ou celles d'un client précis (self ou Admin).
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ConversationDto>>> GetAll([FromQuery] Guid? clientId)
        {
            if (!clientId.HasValue)
            {
                if (!this.IsAdmin()) return Forbid();
                return Ok(await _conversationService.GetAllAsync());
            }

            if (!this.IsAdmin() && this.GetUserId() != clientId) return Forbid();

            return Ok(await _conversationService.GetByClientIdAsync(clientId.Value));
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ConversationDto>> GetById(Guid id)
        {
            var conversation = await _conversationService.GetByIdAsync(id);
            if (conversation is null) return NotFound();

            if (!this.IsAdmin() && this.GetUserId() != conversation.ClientId) return Forbid();

            return Ok(conversation);
        }

        [HttpPost]
        public async Task<ActionResult<ConversationDto>> Create(CreateConversationDto dto)
        {
            // Un client ne peut ouvrir une conversation qu'en son propre nom.
            if (!this.IsAdmin())
            {
                var userId = this.GetUserId();
                if (userId is null) return Unauthorized();
                dto.ClientId = userId.Value;
            }

            var conversation = await _conversationService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = conversation.Id }, conversation);
        }
    }
}
