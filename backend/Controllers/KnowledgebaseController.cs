using backend.Dtos.Knowledgebase;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    // Base de connaissances interne (pas de page publique qui la consomme) : réservée aux admins.
    [ApiController]
    [Route("api/knowledgebase")]
    [Authorize(Roles = "Admin")]
    public class KnowledgebaseController : ControllerBase
    {
        private readonly IKnowledgebaseService _knowledgebaseService;

        public KnowledgebaseController(IKnowledgebaseService knowledgebaseService)
        {
            _knowledgebaseService = knowledgebaseService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<KnowledgebaseDto>>> GetAll()
        {
            return Ok(await _knowledgebaseService.GetAllAsync());
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<KnowledgebaseDto>> GetById(Guid id)
        {
            var entry = await _knowledgebaseService.GetByIdAsync(id);
            return entry is null ? NotFound() : Ok(entry);
        }

        [HttpPost]
        public async Task<ActionResult<KnowledgebaseDto>> Create(CreateKnowledgebaseDto dto)
        {
            var entry = await _knowledgebaseService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = entry.Id }, entry);
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<KnowledgebaseDto>> Update(Guid id, UpdateKnowledgebaseDto dto)
        {
            var entry = await _knowledgebaseService.UpdateAsync(id, dto);
            return entry is null ? NotFound() : Ok(entry);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _knowledgebaseService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }
}
