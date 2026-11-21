using backend.Dtos.Parametre;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/parametres")]
    [Authorize(Roles = "Admin")]
    public class ParametresController : ControllerBase
    {
        private readonly IParametreService _parametreService;

        public ParametresController(IParametreService parametreService)
        {
            _parametreService = parametreService;
        }

        // Public : ce sont les coordonnées affichées sur le site vitrine (footer, page contact).
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ParametreDto>> Get()
        {
            return Ok(await _parametreService.GetAsync());
        }

        [HttpPut]
        public async Task<ActionResult<ParametreDto>> Update(UpdateParametreDto dto)
        {
            return Ok(await _parametreService.UpdateAsync(dto));
        }
    }
}
