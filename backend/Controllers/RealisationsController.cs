using backend.Dtos.Realisation;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    // GET reste public (portfolio consulté sans connexion sur le site) ; seules les actions
    // d'écriture sont réservées aux admins.
    [ApiController]
    [Route("api/realisations")]
    public class RealisationsController : ControllerBase
    {
        private readonly IRealisationService _realisationService;

        public RealisationsController(IRealisationService realisationService)
        {
            _realisationService = realisationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RealisationDto>>> GetAll()
        {
            return Ok(await _realisationService.GetAllAsync());
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<RealisationDto>> GetById(Guid id)
        {
            var realisation = await _realisationService.GetByIdAsync(id);
            return realisation is null ? NotFound() : Ok(realisation);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<RealisationDto>> Create(CreateRealisationDto dto)
        {
            var realisation = await _realisationService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = realisation.Id }, realisation);
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<RealisationDto>> Update(Guid id, UpdateRealisationDto dto)
        {
            var realisation = await _realisationService.UpdateAsync(id, dto);
            return realisation is null ? NotFound() : Ok(realisation);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _realisationService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }
}
