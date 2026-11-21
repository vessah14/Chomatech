using backend.Data;
using backend.Dtos.User;
using backend.Interfaces;
using backend.Models;
using backend.Services.Exceptions;
using backend.Services.Security;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            return await _context.Clients
                .OrderBy(u => u.Nom)
                .Select(u => ToDto(u))
                .ToListAsync();
        }

        public async Task<UserDto?> GetByIdAsync(Guid id)
        {
            var user = await _context.Clients.FindAsync(id);
            return user is null ? null : ToDto(user);
        }

        public async Task<UserDto> CreateAsync(CreateUtilisateurDtos dto)
        {
            var emailExiste = await _context.Clients.AnyAsync(u => u.Email == dto.Email);
            if (emailExiste)
            {
                throw new ConflictException("Un compte existe déjà avec cet email.");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Nom = dto.Nom,
                Prenom = dto.Prenom,
                Email = dto.Email,
                Password = PasswordHasher.Hash(dto.Password),
                Role = dto.Role,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.Clients.Add(user);
            await _context.SaveChangesAsync();

            return ToDto(user);
        }

        public async Task<UserDto?> UpdateAsync(Guid id, UpdateUtilisateurDtos dto)
        {
            var user = await _context.Clients.FindAsync(id);
            if (user is null) return null;

            var emailPrisParAutrui = await _context.Clients
                .AnyAsync(u => u.Id != id && u.Email == dto.Email);
            if (emailPrisParAutrui)
            {
                throw new ConflictException("Cet email est déjà utilisé par un autre compte.");
            }

            user.Nom = dto.Nom;
            user.Prenom = dto.Prenom;
            user.Email = dto.Email;

            await _context.SaveChangesAsync();

            return ToDto(user);
        }

        public async Task<UserDto?> UpdateRoleAsync(Guid id, UpdateUserRoleDto dto)
        {
            var user = await _context.Clients.FindAsync(id);
            if (user is null) return null;

            if (user.Role == "Admin" && dto.Role != "Admin")
            {
                await VerifierPasDernierAdminAsync("Impossible de retirer le rôle du dernier administrateur.");
            }

            user.Role = dto.Role;
            await _context.SaveChangesAsync();

            return ToDto(user);
        }

        public async Task ChangePasswordAsync(Guid id, ChangePasswordDto dto)
        {
            var user = await _context.Clients.FindAsync(id)
                ?? throw new NotFoundException("Utilisateur introuvable.");

            if (!PasswordHasher.Verify(dto.MotDePasseActuel, user.Password))
            {
                // 400 et non 401 : l'utilisateur est bien authentifié, seule la saisie est fausse.
                // Un 401 ferait croire aux front-ends que la session a expiré (déconnexion forcée).
                throw new BadRequestException("Mot de passe actuel incorrect.");
            }

            user.Password = PasswordHasher.Hash(dto.NouveauMotDePasse);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var user = await _context.Clients.FindAsync(id);
            if (user is null) return false;

            if (user.Role == "Admin")
            {
                await VerifierPasDernierAdminAsync("Impossible de supprimer le dernier administrateur.");
            }

            _context.Clients.Remove(user);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Contrainte ON DELETE RESTRICT (voir schema.sql) : un client avec des demandes
                // de produit/service existantes ne peut pas être supprimé, pour préserver l'historique.
                throw new ConflictException("Ce client a encore des commandes associées et ne peut pas être supprimé.");
            }

            return true;
        }

        // Sans au moins un Admin, plus personne ne peut entrer dans le back-office ni promouvoir
        // un compte (UpdateRoleAsync est lui-même réservé aux admins) : blocage irréversible.
        private async Task VerifierPasDernierAdminAsync(string message)
        {
            var nbAdmins = await _context.Clients.CountAsync(u => u.Role == "Admin");
            if (nbAdmins <= 1)
            {
                throw new ConflictException(message);
            }
        }

        private static UserDto ToDto(User user) => new()
        {
            Id = user.Id,
            Nom = user.Nom,
            Prenom = user.Prenom,
            Email = user.Email,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }
}
