using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Dtos.User;
using backend.Interfaces;
using backend.Models;
using backend.Services.Exceptions;
using backend.Services.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services
{
    public class AuthService : IAuthService
    {
        public const string PurposeClaim = "purpose";
        private const string ResetPasswordPurpose = "password_reset";

        // Empreinte du hash de mot de passe courant embarquée dans le jeton de réinitialisation :
        // dès que le mot de passe change, l'empreinte ne correspond plus et le lien devient
        // inutilisable (usage unique, et invalidé aussi par un changement depuis le profil).
        public const string PasswordStampClaim = "pwd_stamp";

        // Présent (= "1") sur les jetons émis avec "se souvenir de moi" : permet de renouveler la
        // session avec la même durée (ex. après un changement de mot de passe).
        public const string RememberMeClaim = "rm";

        // Hash d'un mot de passe aléatoire, utilisé seulement pour égaliser la durée de LoginAsync.
        private static readonly string HashFactice =
            PasswordHasher.Hash(Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)));

        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;
        private readonly IHostEnvironment _environment;
        private readonly LoginLockout _lockout;
        private readonly IEmailService _emailService;

        public AuthService(AppDbContext context, IConfiguration configuration, ILogger<AuthService> logger, IHostEnvironment environment, LoginLockout lockout, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _environment = environment;
            _lockout = lockout;
            _emailService = emailService;
        }

        public async Task<LoginResponseDto> LoginAsync(LoginDto dto)
        {
            _lockout.VerifierNonBloque(dto.Email);

            var user = await _context.Clients.SingleOrDefaultAsync(u => u.Email == dto.Email);

            // Email inconnu : on calcule quand même un hash (≈ même durée qu'un vrai essai), sinon
            // la réponse plus rapide trahirait quels emails ont un compte (énumération par timing).
            var motDePasseValide = PasswordHasher.Verify(dto.Password, user?.Password ?? HashFactice)
                && user is not null;

            if (user is null || !motDePasseValide)
            {
                _lockout.EnregistrerEchec(dto.Email);
                throw new UnauthorizedAppException("Email ou mot de passe incorrect.");
            }

            _lockout.Reinitialiser(dto.Email);
            return CreerReponseConnexion(user, dto.RememberMe);
        }

        // Connexion Google/Facebook : l'identité a déjà été vérifiée auprès du fournisseur
        // (ExternalAuthService). Email connu = connexion à ce compte ; sinon création d'un compte
        // Client. Les deux fournisseurs ne renvoient qu'un email vérifié/confirmé, ce qui empêche
        // de prendre le contrôle du compte d'autrui avec une adresse non prouvée.
        public async Task<LoginResponseDto> LoginExterneAsync(ProfilExterne profil, bool rememberMe)
        {
            var user = await _context.Clients.SingleOrDefaultAsync(u => u.Email == profil.Email);

            // Un compte Admin ne s'ouvre qu'avec son mot de passe : sinon quiconque contrôle la
            // boîte mail Google/Facebook de l'admin obtiendrait l'accès au back-office.
            if (user?.Role == "Admin")
            {
                throw new UnauthorizedAppException(
                    "Les comptes administrateur doivent se connecter avec leur email et leur mot de passe.");
            }

            if (user is null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    Nom = profil.Nom,
                    Prenom = string.IsNullOrWhiteSpace(profil.Prenom) ? profil.Email.Split('@')[0] : profil.Prenom,
                    Email = profil.Email,
                    // Mot de passe aléatoire jamais communiqué : le compte ne se connecte que via le
                    // fournisseur, jusqu'à ce que l'utilisateur en définisse un via "mot de passe oublié".
                    Password = PasswordHasher.Hash(Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))),
                    Role = "Client", // jamais Admin par ce chemin, comme pour SignupAsync
                    CreatedAt = DateTimeOffset.UtcNow
                };

                _context.Clients.Add(user);
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException)
                {
                    // Double clic / deux onglets : le compte vient d'être créé par l'autre requête.
                    _context.ChangeTracker.Clear();
                    user = await _context.Clients.SingleAsync(u => u.Email == profil.Email);
                }
            }

            return CreerReponseConnexion(user, rememberMe);
        }

        // Nouvelle session pour un compte déjà authentifié (ex. après changement de mot de passe,
        // qui invalide l'ancien jeton via l'empreinte pwd_stamp).
        public async Task<LoginResponseDto> RenouvelerSessionAsync(Guid userId, bool rememberMe)
        {
            var user = await _context.Clients.FindAsync(userId)
                ?? throw new NotFoundException("Utilisateur introuvable.");
            return CreerReponseConnexion(user, rememberMe);
        }

        private LoginResponseDto CreerReponseConnexion(User user, bool rememberMe)
        {
            // Jamais de jeton longue durée pour un Admin : un jeton JWT ne peut pas être révoqué,
            // un jeton Admin volé resterait donc valable 30 jours.
            var longueDuree = rememberMe && user.Role != "Admin";
            var (token, expiration) = GenerateAccessToken(user, longueDuree);

            return new LoginResponseDto
            {
                Token = token,
                Persistant = longueDuree,
                Expiration = expiration,
                Utilisateur = ToUserDto(user)
            };
        }

        public async Task<UserDto> SignupAsync(SignupDto dto)
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
                Role = "Client", // toujours forcé : l'auto-inscription ne permet jamais de devenir Admin
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.Clients.Add(user);
            await _context.SaveChangesAsync();

            return ToUserDto(user);
        }

        public async Task DemanderResetPasswordAsync(DemanderResetPasswordDto dto)
        {
            var user = await _context.Clients.SingleOrDefaultAsync(u => u.Email == dto.Email);

            // On ne révèle jamais si l'email existe ou non (anti-énumération de comptes) :
            // le Controller doit renvoyer la même réponse générique dans les deux cas.
            if (user is null) return;

            var resetToken = GenerateResetToken(user);

            // Lien vers la page "Nouveau mot de passe" du site client (App:SiteUrl). Envoyé par
            // Brevo ; sans configuration Brevo, l'email (et donc le lien) s'affiche dans la console
            // en Development uniquement (voir BrevoService).
            var siteUrl = (_configuration["App:SiteUrl"] ?? "http://localhost:5173").TrimEnd('/');
            var lien = $"{siteUrl}/reinitialiser-mot-de-passe?token={Uri.EscapeDataString(resetToken)}";

            await _emailService.EnvoyerAsync(EmailTemplates.ReinitialisationMotDePasse(user.Email, user.Prenom, lien));

            // Identifiant plutôt qu'email : pas de donnée personnelle dans les logs.
            _logger.LogInformation("Demande de réinitialisation traitée pour le compte {UserId}.", user.Id);
        }

        public async Task ResetPasswordAsync(ResetPasswordDto dto)
        {
            var principal = ValidateResetToken(dto.Token);
            if (!Guid.TryParse(principal.FindFirstValue(JwtRegisteredClaimNames.Sub), out var userId))
            {
                throw new BadRequestException("Lien de réinitialisation invalide.");
            }

            var user = await _context.Clients.FindAsync(userId)
                ?? throw new BadRequestException("Lien de réinitialisation invalide ou expiré.");

            var stamp = principal.FindFirstValue(PasswordStampClaim);
            if (stamp is null || !CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(stamp), Encoding.UTF8.GetBytes(PasswordStamp(user.Password))))
            {
                throw new BadRequestException("Lien de réinitialisation déjà utilisé ou expiré.");
            }

            user.Password = PasswordHasher.Hash(dto.NewPassword);
            await _context.SaveChangesAsync();
        }

        private (string Token, DateTimeOffset Expiration) GenerateAccessToken(User user, bool rememberMe)
        {
            var jwt = _configuration.GetSection("Jwt");
            var key = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key manquant dans la configuration.");
            var expiration = rememberMe
                ? DateTimeOffset.UtcNow.AddDays(jwt.GetValue<int?>("RememberMeDays") ?? 30)
                : DateTimeOffset.UtcNow.AddMinutes(jwt.GetValue<int?>("ExpiresMinutes") ?? 60);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, user.Role),
                // Vérifiée à chaque requête (Program.cs, OnTokenValidated) : changer le mot de
                // passe invalide immédiatement tous les jetons émis avant.
                new Claim(PasswordStampClaim, PasswordStamp(user.Password))
            }.Concat(rememberMe ? new[] { new Claim(RememberMeClaim, "1") } : Array.Empty<Claim>()).ToArray();

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwt["Issuer"],
                audience: jwt["Audience"],
                claims: claims,
                expires: expiration.UtcDateTime,
                signingCredentials: credentials);

            return (new JwtSecurityTokenHandler().WriteToken(token), expiration);
        }

        private string GenerateResetToken(User user)
        {
            var jwt = _configuration.GetSection("Jwt");
            var key = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key manquant dans la configuration.");

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(PurposeClaim, ResetPasswordPurpose),
                new Claim(PasswordStampClaim, PasswordStamp(user.Password))
            };

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwt["Issuer"],
                audience: jwt["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(30),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private ClaimsPrincipal ValidateResetToken(string token)
        {
            var jwt = _configuration.GetSection("Jwt");
            var key = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key manquant dans la configuration.");

            // MapInboundClaims = false : sinon le handler renomme "sub" en ClaimTypes.NameIdentifier
            // et FindFirstValue(Sub) renvoie null (la réinitialisation plantait alors en 500).
            var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
            ClaimsPrincipal principal;
            try
            {
                principal = handler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt["Issuer"],
                    ValidateAudience = true,
                    ValidAudience = jwt["Audience"],
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
                }, out _);
            }
            catch (Exception)
            {
                throw new BadRequestException("Lien de réinitialisation invalide ou expiré.");
            }

            if (principal.FindFirstValue(PurposeClaim) != ResetPasswordPurpose)
            {
                throw new BadRequestException("Lien de réinitialisation invalide.");
            }

            return principal;
        }

        // Dérivé du hash stocké (lui-même salé) : ne révèle rien du mot de passe, mais change
        // à chaque nouveau mot de passe.
        public static string PasswordStamp(string passwordHash) =>
            Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(passwordHash)))[..16];

        private static UserDto ToUserDto(User user) => new()
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
