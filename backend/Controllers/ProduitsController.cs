using backend.Dtos.Produit;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    // GET reste public (catalogue consulté sans connexion sur le site) ; seules les actions
    // d'écriture sont réservées aux admins.
    [ApiController]
    [Route("api/produits")]
    public class ProduitsController : ControllerBase
    {
        private readonly IProduitService _produitService;

        public ProduitsController(IProduitService produitService)
        {
            _produitService = produitService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProduitDto>>> GetAll()
        {
            return Ok(await _produitService.GetAllAsync());
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ProduitDto>> GetById(Guid id)
        {
            var produit = await _produitService.GetByIdAsync(id);
            return produit is null ? NotFound() : Ok(produit);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ProduitDto>> Create(CreateProduitDto dto)
        {
            var produit = await _produitService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = produit.Id }, produit);
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ProduitDto>> Update(Guid id, UpdateProduitDto dto)
        {
            var produit = await _produitService.UpdateAsync(id, dto);
            return produit is null ? NotFound() : Ok(produit);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _produitService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }
}
