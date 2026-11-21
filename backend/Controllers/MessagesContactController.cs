using backend.Dtos.MessageContact;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace backend.Controllers
{
    // POST reste public (formulaire de contact rempli par un visiteur non connecté) ;
    // la consultation/gestion des messages reçus est réservée aux admins.
    [ApiController]
    [Route("api/messages-contact")]
    public class MessagesContactController : ControllerBase
    {
        private readonly IMessageContactService _messageContactService;

        public MessagesContactController(IMessageContactService messageContactService)
        {
            _messageContactService = messageContactService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<MessageContactDto>>> GetAll()
        {
            return Ok(await _messageContactService.GetAllAsync());
        }

        [HttpGet("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<MessageContactDto>> GetById(Guid id)
        {
            var message = await _messageContactService.GetByIdAsync(id);
            return message is null ? NotFound() : Ok(message);
        }

        [HttpPost]
        [EnableRateLimiting("public")]
        public async Task<ActionResult<MessageContactDto>> Create(CreateMessageContactDto dto)
        {
            var message = await _messageContactService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = message.Id }, message);
        }

        [HttpPatch("{id:guid}/lu")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<MessageContactDto>> UpdateStatut(Guid id, UpdateMessageContactStatutDto dto)
        {
            var message = await _messageContactService.UpdateStatutAsync(id, dto);
            return message is null ? NotFound() : Ok(message);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _messageContactService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }
}
