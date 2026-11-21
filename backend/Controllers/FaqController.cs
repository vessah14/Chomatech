using backend.Dtos.Faq;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    // GET reste public (page FAQ consultée sans connexion) ; seules les actions d'écriture
    // sont réservées aux admins.
    [ApiController]
    [Route("api/faqs")]
    public class FaqController : ControllerBase
    {
        private readonly IFaqService _faqService;

        public FaqController(IFaqService faqService)
        {
            _faqService = faqService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FaqDto>>> GetAll()
        {
            return Ok(await _faqService.GetAllAsync());
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<FaqDto>> GetById(Guid id)
        {
            var faq = await _faqService.GetByIdAsync(id);
            return faq is null ? NotFound() : Ok(faq);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<FaqDto>> Create(CreateFaqDto dto)
        {
            var faq = await _faqService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = faq.Id }, faq);
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<FaqDto>> Update(Guid id, UpdateFaqDto dto)
        {
            var faq = await _faqService.UpdateAsync(id, dto);
            return faq is null ? NotFound() : Ok(faq);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _faqService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }
}
