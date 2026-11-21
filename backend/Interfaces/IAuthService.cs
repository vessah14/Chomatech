using backend.Dtos.User;

namespace backend.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto> LoginAsync(LoginDto dto);
        Task<LoginResponseDto> LoginExterneAsync(ProfilExterne profil, bool rememberMe);
        Task<LoginResponseDto> RenouvelerSessionAsync(Guid userId, bool rememberMe);
        Task<UserDto> SignupAsync(SignupDto dto);
        Task DemanderResetPasswordAsync(DemanderResetPasswordDto dto);
        Task ResetPasswordAsync(ResetPasswordDto dto);
    }
}
