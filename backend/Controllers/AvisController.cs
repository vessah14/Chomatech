using backend.Controllers.Common;
using backend.Dtos.Avis;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/avis")]
    [Authorize]
    public class AvisController : ControllerBase
    {
        private readonly IAvisService _avisService;

        public AvisController(IAvisService avisService)
        {
            _avisService = avisService;
        }

        // Public (site vitrine) : avis validés uniquement, consultables sans connexion.
        [HttpGet("publies")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<AvisDto>>> GetPublies()
        {
            return Ok(await _avisService.GetPublieesAsync());
        }

        // Tous les avis (Admin, pour la modération) ou ceux d'un client précis (self ou Admin).
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AvisDto>>> GetAll([FromQuery] Guid? clientId)
        {
            if (!clientId.HasValue)
            {
                if (!this.IsAdmin()) return Forbid();
                return Ok(await _avisService.GetAllAsync());
            }

            if (!this.IsAdmin() && this.GetUserId() != clientId) return Forbid();

            return Ok(await _avisService.GetByClientIdAsync(clientId.Value));
        }

        [HttpPost]
        public async Task<ActionResult<AvisDto>> Create(CreateAvisDto dto)
        {
            var userId = this.GetUserId();
            if (userId is null) return Unauthorized();

            var avis = await _avisService.CreateAsync(userId.Value, dto);
            return CreatedAtAction(nameof(GetAll), new { clientId = userId.Value }, avis);
        }

        [HttpPatch("{id:guid}/statut")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<AvisDto>> UpdateStatut(Guid id, UpdateAvisStatutDto dto)
        {
            var avis = await _avisService.UpdateStatutAsync(id, dto);
            return avis is null ? NotFound() : Ok(avis);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _avisService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }
}
