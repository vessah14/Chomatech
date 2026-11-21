using backend.Dtos.Newsletter;

namespace backend.Interfaces
{
    public interface INewsletterService
    {
        Task<IEnumerable<AbonneNewsletterDto>> GetAllAsync();
        Task InscrireAsync(CreateAbonneNewsletterDto dto);
        Task<bool> DeleteAsync(Guid id);
        Task<int> EnvoyerCampagneAsync(string sujet, string contenu);
    }
}
