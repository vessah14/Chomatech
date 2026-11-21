using backend.Data;
using backend.Dtos.Parametre;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class ParametreService : IParametreService
    {
        private readonly AppDbContext _context;

        public ParametreService(AppDbContext context)
        {
            _context = context;
        }

        // Lecture publique sans écriture : si aucune ligne n'existe encore, on renvoie les valeurs
        // par défaut sans les persister (la ligne n'est créée qu'au premier enregistrement admin).
        // FirstOrDefault plutôt que SingleOrDefault : si une ligne en double existait, un Single
        // ferait échouer toutes les lectures en 500.
        public async Task<ParametreDto> GetAsync()
        {
            var parametre = await LireAsync() ?? ValeursParDefaut();
            return ToDto(parametre);
        }

        public async Task<ParametreDto> UpdateAsync(UpdateParametreDto dto)
        {
            var parametre = await LireAsync() ?? await CreerParDefautAsync();

            parametre.NomEntreprise = dto.NomEntreprise;
            parametre.Slogan = dto.Slogan;
            parametre.Email = dto.Email;
            parametre.Telephone = dto.Telephone;
            parametre.Adresse = dto.Adresse;
            parametre.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            return ToDto(parametre);
        }

        private Task<Parametre?> LireAsync() =>
            _context.Parametres.OrderByDescending(p => p.UpdatedAt).FirstOrDefaultAsync();

        private static Parametre ValeursParDefaut() => new()
        {
            Id = Guid.NewGuid(),
            NomEntreprise = "CHOMA TECH",
            Slogan = "Innover aujourd'hui, impacter demain.",
            Email = "contact@chomatech.cm",
            Telephone = "+237 6XX XXX XXX",
            Adresse = "Douala, Cameroun",
            UpdatedAt = DateTimeOffset.UtcNow
        };

        // Table à ligne unique : créée au premier enregistrement admin plutôt que d'exiger
        // une étape de seed séparée.
        private async Task<Parametre> CreerParDefautAsync()
        {
            var parametre = ValeursParDefaut();

            _context.Parametres.Add(parametre);
            await _context.SaveChangesAsync();

            return parametre;
        }

        private static ParametreDto ToDto(Parametre p) => new()
        {
            NomEntreprise = p.NomEntreprise,
            Slogan = p.Slogan,
            Email = p.Email,
            Telephone = p.Telephone,
            Adresse = p.Adresse,
            UpdatedAt = p.UpdatedAt
        };
    }
}
