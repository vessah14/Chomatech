using backend.Dtos.Service;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    // GET reste public (catalogue consulté sans connexion sur le site) ; seules les actions
    // d'écriture sont réservées aux admins.
    [ApiController]
    [Route("api/services")]
    public class ServicesController : ControllerBase
    {
        private readonly IServiceService _serviceService;

        public ServicesController(IServiceService serviceService)
        {
            _serviceService = serviceService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServiceDto>>> GetAll()
        {
            return Ok(await _serviceService.GetAllAsync());
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ServiceDto>> GetById(Guid id)
        {
            var service = await _serviceService.GetByIdAsync(id);
            return service is null ? NotFound() : Ok(service);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ServiceDto>> Create(CreateServiceDto dto)
        {
            var service = await _serviceService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = service.Id }, service);
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ServiceDto>> Update(Guid id, UpdateServiceDto dto)
        {
            var service = await _serviceService.UpdateAsync(id, dto);
            return service is null ? NotFound() : Ok(service);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _serviceService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }
}
