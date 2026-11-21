using backend.Dtos.Annonce;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace backend.Controllers
{
    // GET + incrément de vues restent publics (page Annonces consultée sans connexion) ;
    // seules les actions d'écriture sont réservées aux admins.
    [ApiController]
    [Route("api/annonces")]
    public class AnnoncesController : ControllerBase
    {
        private readonly IAnnonceService _annonceService;

        public AnnoncesController(IAnnonceService annonceService)
        {
            _annonceService = annonceService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AnnonceDto>>> GetAll()
        {
            return Ok(await _annonceService.GetAllAsync());
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<AnnonceDto>> GetById(Guid id)
        {
            var annonce = await _annonceService.GetByIdAsync(id);
            return annonce is null ? NotFound() : Ok(annonce);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<AnnonceDto>> Create(CreateAnnonceDto dto)
        {
            try
            {
                var annonce = await _annonceService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = annonce.Id }, annonce);
            }
            catch (EmailDeliveryException ex)
            {
                return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Annonce enregistrée, email non envoyé", detail: ex.Message);
            }
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<AnnonceDto>> Update(Guid id, UpdateAnnonceDto dto)
        {
            try
            {
                var annonce = await _annonceService.UpdateAsync(id, dto);
                return annonce is null ? NotFound() : Ok(annonce);
            }
            catch (EmailDeliveryException ex)
            {
                return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Annonce enregistrée, email non envoyé", detail: ex.Message);
            }
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _annonceService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }

        // Consultation publique d'une annonce : incrémente le compteur de vues.
        [HttpPost("{id:guid}/vues")]
        [EnableRateLimiting("vues")]
        public async Task<IActionResult> IncrementerVues(Guid id)
        {
            await _annonceService.IncrementerVuesAsync(id);
            return NoContent();
        }
    }
}
