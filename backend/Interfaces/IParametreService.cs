using backend.Dtos.Parametre;

namespace backend.Interfaces
{
    public interface IParametreService
    {
        Task<ParametreDto> GetAsync();
        Task<ParametreDto> UpdateAsync(UpdateParametreDto dto);
    }
}
