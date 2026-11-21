using backend.Dtos.User;

namespace backend.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<UserDto?> GetByIdAsync(Guid id);
        Task<UserDto> CreateAsync(CreateUtilisateurDtos dto);
        Task<UserDto?> UpdateAsync(Guid id, UpdateUtilisateurDtos dto);
        Task<UserDto?> UpdateRoleAsync(Guid id, UpdateUserRoleDto dto);
        Task ChangePasswordAsync(Guid id, ChangePasswordDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
