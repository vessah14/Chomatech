using backend.Controllers.Common;
using backend.Dtos.User;
using backend.Interfaces;
using backend.Services;
using backend.Services.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IAuthService _authService;

        public UsersController(IUserService userService, IAuthService authService)
        {
            _userService = userService;
            _authService = authService;
        }

        // Gestion de tous les comptes : réservée aux admins.
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
        {
            return Ok(await _userService.GetAllAsync());
        }

        [HttpGet("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<UserDto>> GetById(Guid id)
        {
            var user = await _userService.GetByIdAsync(id);
            return user is null ? NotFound() : Ok(user);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<UserDto>> Create(CreateUtilisateurDtos dto)
        {
            var user = await _userService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<UserDto>> Update(Guid id, UpdateUtilisateurDtos dto)
        {
            var user = await _userService.UpdateAsync(id, dto);
            return user is null ? NotFound() : Ok(user);
        }

        [HttpPatch("{id:guid}/role")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<UserDto>> UpdateRole(Guid id, UpdateUserRoleDto dto)
        {
            var user = await _userService.UpdateRoleAsync(id, dto);
            return user is null ? NotFound() : Ok(user);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            // Un admin qui supprime son propre compte depuis la liste se déconnecterait lui-même
            // au prochain appel, sans retour possible : on l'empêche explicitement.
            if (this.GetUserId() == id)
            {
                return BadRequest(new { error = "Vous ne pouvez pas supprimer votre propre compte." });
            }

            var deleted = await _userService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }

        // Self-service : n'importe quel compte connecté peut consulter/modifier son propre profil
        // sans être Admin (sinon un simple client n'aurait aucun moyen de voir ses propres infos).
        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetMe()
        {
            var userId = this.GetUserId();
            if (userId is null) return Unauthorized();

            var user = await _userService.GetByIdAsync(userId.Value);
            return user is null ? NotFound() : Ok(user);
        }

        [HttpPut("me")]
        public async Task<ActionResult<UserDto>> UpdateMe(UpdateUtilisateurDtos dto)
        {
            var userId = this.GetUserId();
            if (userId is null) return Unauthorized();

            var user = await _userService.UpdateAsync(userId.Value, dto);
            return user is null ? NotFound() : Ok(user);
        }

        [HttpPatch("me/password")]
        public async Task<IActionResult> ChangeMyPassword(ChangePasswordDto dto)
        {
            var userId = this.GetUserId();
            if (userId is null) return Unauthorized();

            await _userService.ChangePasswordAsync(userId.Value, dto);

            // Le changement invalide tous les jetons existants (empreinte pwd_stamp), y compris
            // celui de cette requête : on rouvre une session pour l'appareil courant, avec la même
            // durée qu'avant. Les autres appareils (ou un voleur de jeton) sont déconnectés.
            var garderLongtemps = User.FindFirst(AuthService.RememberMeClaim)?.Value == "1";
            var session = await _authService.RenouvelerSessionAsync(userId.Value, garderLongtemps);
            AuthCookies.Ecrire(HttpContext, session.Token, session.Expiration, session.Persistant);
            return NoContent();
        }
    }
}
