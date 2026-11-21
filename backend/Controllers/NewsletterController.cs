using backend.Dtos.Newsletter;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace backend.Controllers
{
    // POST reste public (formulaire newsletter rempli par un visiteur non connecté) ;
    // la consultation/gestion des abonnés est réservée aux admins.
    [ApiController]
    [Route("api/newsletter")]
    public class NewsletterController : ControllerBase
    {
        private readonly INewsletterService _newsletterService;

        public NewsletterController(INewsletterService newsletterService)
        {
            _newsletterService = newsletterService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<AbonneNewsletterDto>>> GetAll()
        {
            return Ok(await _newsletterService.GetAllAsync());
        }

        [HttpPost]
        [EnableRateLimiting("public")]
        public async Task<IActionResult> Inscrire(CreateAbonneNewsletterDto dto)
        {
            await _newsletterService.InscrireAsync(dto);

            // Réponse identique que l'email soit nouveau ou déjà inscrit (voir NewsletterService).
            return Ok(new { message = "Inscription enregistrée." });
        }

        [HttpPost("envoyer")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Envoyer(EnvoyerNewsletterDto dto)
        {
            try
            {
                var nombre = await _newsletterService.EnvoyerCampagneAsync(dto.Sujet.Trim(), dto.Contenu.Trim());
                return Ok(new { nombreEnvoye = nombre });
            }
            catch (EmailDeliveryException ex)
            {
                return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Newsletter non envoyée", detail: ex.Message);
            }
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _newsletterService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }
}
