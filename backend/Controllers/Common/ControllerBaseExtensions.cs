using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers.Common
{
    public static class ControllerBaseExtensions
    {
        // Correspond au claim "sub" posé par AuthService.GenerateAccessToken.
        public static Guid? GetUserId(this ControllerBase controller)
        {
            var value = controller.User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return Guid.TryParse(value, out var id) ? id : null;
        }

        public static bool IsAdmin(this ControllerBase controller)
        {
            return controller.User.IsInRole("Admin");
        }
    }
}
