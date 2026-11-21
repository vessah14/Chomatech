using backend.Dtos.User;
using backend.Interfaces;
using backend.Services.Exceptions;
using backend.Services.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    [EnableRateLimiting("auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IExternalAuthService _externalAuthService;

        public AuthController(IAuthService authService, IExternalAuthService externalAuthService)
        {
            _authService = authService;
            _externalAuthService = externalAuthService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login(LoginDto dto)
        {
            return OuvrirSession(await _authService.LoginAsync(dto));
        }

        [HttpPost("google")]
        public async Task<ActionResult<LoginResponseDto>> LoginGoogle(SocialLoginDto dto)
        {
            var profil = await _externalAuthService.VerifierGoogleAsync(dto.AccessToken);
            return OuvrirSession(await _authService.LoginExterneAsync(profil, dto.RememberMe));
        }

        [HttpPost("facebook")]
        public async Task<ActionResult<LoginResponseDto>> LoginFacebook(SocialLoginDto dto)
        {
            var profil = await _externalAuthService.VerifierFacebookAsync(dto.AccessToken);
            return OuvrirSession(await _authService.LoginExterneAsync(profil, dto.RememberMe));
        }

        // Le cookie est HttpOnly : le front ne peut pas l'effacer lui-même, seul le serveur le peut.
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            AuthCookies.Effacer(HttpContext);
            return NoContent();
        }

        [HttpPost("signup")]
        public async Task<ActionResult<UserDto>> Signup(SignupDto dto)
        {
            var result = await _authService.SignupAsync(dto);
            return CreatedAtAction(nameof(Signup), new { id = result.Id }, result);
        }

        [HttpPost("demander-reset-password")]
        public async Task<IActionResult> DemanderResetPassword(DemanderResetPasswordDto dto)
        {
            await _authService.DemanderResetPasswordAsync(dto);

            // Réponse générique dans tous les cas (email existant ou non),
            // pour ne pas permettre à quelqu'un de deviner quels emails sont inscrits.
            return Ok(new { message = "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
        {
            await _authService.ResetPasswordAsync(dto);
            return Ok(new { message = "Mot de passe réinitialisé avec succès." });
        }

        private ActionResult<LoginResponseDto> OuvrirSession(LoginResponseDto session)
        {
            // Le panneau d'administration ne reçoit jamais de cookie pour un compte non-Admin
            // (le contrôle côté front seul serait contournable).
            if (AuthCookies.App(HttpContext) == AuthCookies.AppAdmin && session.Utilisateur?.Role != "Admin")
            {
                throw new ForbiddenException("Ce compte n'a pas accès à l'administration.");
            }

            AuthCookies.Ecrire(HttpContext, session.Token, session.Expiration, session.Persistant);
            return Ok(session);
        }
    }
}
