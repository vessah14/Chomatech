using backend.Controllers.Common;
using backend.Dtos.DemandeProduit;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/demandes-produits")]
    [Authorize]
    public class DemandesProduitController : ControllerBase
    {
        private readonly IDemandeProduitService _demandeProduitService;

        public DemandesProduitController(IDemandeProduitService demandeProduitService)
        {
            _demandeProduitService = demandeProduitService;
        }

        // Vue globale (Admin) ou historique d'un client précis (self ou Admin).
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DemandeProduitDto>>> GetAll([FromQuery] Guid? clientId)
        {
            if (!clientId.HasValue)
            {
                if (!this.IsAdmin()) return Forbid();
                return Ok(await _demandeProduitService.GetAllAsync());
            }

            if (!this.IsAdmin() && this.GetUserId() != clientId) return Forbid();

            return Ok(await _demandeProduitService.GetByClientIdAsync(clientId.Value));
        }

        [HttpGet("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DemandeProduitDto>> GetById(Guid id)
        {
            var demande = await _demandeProduitService.GetByIdAsync(id);
            return demande is null ? NotFound() : Ok(demande);
        }

        [HttpPost]
        public async Task<ActionResult<DemandeProduitDto>> Create(CreateDemandeProduitDto dto)
        {
            // Un client ne peut commander qu'en son propre nom ; seul un Admin peut passer
            // commande pour un autre client (ex. commande téléphonique saisie manuellement).
            if (!this.IsAdmin())
            {
                var userId = this.GetUserId();
                if (userId is null) return Unauthorized();
                dto.ClientId = userId.Value;
            }

            var demande = await _demandeProduitService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = demande.Id }, demande);
        }

        // Validation du panier : toujours au nom du client connecté, tout ou rien.
        [HttpPost("lot")]
        public async Task<ActionResult<IEnumerable<DemandeProduitDto>>> CreateLot(CreateDemandesProduitLotDto dto)
        {
            var userId = this.GetUserId();
            if (userId is null) return Unauthorized();

            return Ok(await _demandeProduitService.CreateLotAsync(userId.Value, dto));
        }

        [HttpPatch("{id:guid}/statut")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DemandeProduitDto>> UpdateStatut(Guid id, UpdateDemandeProduitStatutDto dto)
        {
            var demande = await _demandeProduitService.UpdateStatutAsync(id, dto);
            return demande is null ? NotFound() : Ok(demande);
        }

        [HttpPatch("{id:guid}/quantite")]
        public async Task<ActionResult<DemandeProduitDto>> UpdateQuantiteClient(Guid id, UpdateDemandeProduitQuantiteDto dto)
        {
            var userId = this.GetUserId();
            if (userId is null) return Unauthorized();
            var demande = await _demandeProduitService.UpdateQuantiteClientAsync(id, userId.Value, dto);
            return demande is null ? NotFound() : Ok(demande);
        }

        [HttpPost("{id:guid}/annuler")]
        public async Task<ActionResult<DemandeProduitDto>> AnnulerClient(Guid id)
        {
            var userId = this.GetUserId();
            if (userId is null) return Unauthorized();
            var demande = await _demandeProduitService.AnnulerClientAsync(id, userId.Value);
            return demande is null ? NotFound() : Ok(demande);
        }

        [HttpDelete("{id:guid}/client")]
        public async Task<IActionResult> DeleteClient(Guid id)
        {
            var userId = this.GetUserId();
            if (userId is null) return Unauthorized();
            var deleted = await _demandeProduitService.DeleteClientAsync(id, userId.Value);
            return deleted ? NoContent() : NotFound();
        }

        [HttpPatch("{id:guid}/paiement")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DemandeProduitDto>> UpdatePaiement(Guid id, UpdateDemandeProduitPaiementDto dto)
        {
            var demande = await _demandeProduitService.UpdatePaiementAsync(id, dto);
            return demande is null ? NotFound() : Ok(demande);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _demandeProduitService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }
}
