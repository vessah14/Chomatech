using backend.Models;
using backend.Services.Security;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    // Installation neuve (ex. base Docker vide) : sans compte Admin, personne ne peut entrer dans
    // le back-office ni promouvoir un compte. Si Bootstrap:AdminEmail et Bootstrap:AdminPassword
    // sont fournis ET qu'aucun Admin n'existe, on crée ce premier administrateur au démarrage.
    // Sans effet dès qu'un Admin existe : les identifiants peuvent rester dans la configuration.
    public static class AdminBootstrap
    {
        public static async Task ExecuterAsync(WebApplication app)
        {
            var email = app.Configuration["Bootstrap:AdminEmail"];
            var motDePasse = app.Configuration["Bootstrap:AdminPassword"];
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(motDePasse)) return;

            var logger = app.Services.GetRequiredService<ILogger<AppDbContext>>();
            if (motDePasse.Length < 8)
            {
                logger.LogError("Bootstrap:AdminPassword doit contenir au moins 8 caractères : premier admin non créé.");
                return;
            }

            // La base peut finir de démarrer juste après l'API (conteneurs) : quelques essais.
            for (var essai = 1; essai <= 10; essai++)
            {
                try
                {
                    using var scope = app.Services.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    if (await db.Clients.AnyAsync(u => u.Role == "Admin")) return;

                    db.Clients.Add(new User
                    {
                        Id = Guid.NewGuid(),
                        Nom = "Administrateur",
                        Prenom = "CHOMA TECH",
                        Email = email.Trim(),
                        Password = PasswordHasher.Hash(motDePasse),
                        Role = "Admin",
                        CreatedAt = DateTimeOffset.UtcNow
                    });
                    await db.SaveChangesAsync();
                    logger.LogInformation("Premier administrateur créé ({Email}).", email);
                    return;
                }
                catch (Exception ex)
                {
                    if (essai == 10)
                    {
                        // Ne jamais empêcher l'API de démarrer pour autant : on le signale clairement.
                        logger.LogError(ex, "Premier administrateur non créé : base de données inaccessible ou sans tables (schéma appliqué ?).");
                        return;
                    }
                    logger.LogWarning("Base indisponible pour créer le premier admin (essai {Essai}/10) : {Erreur}", essai, ex.Message);
                    await Task.Delay(TimeSpan.FromSeconds(3));
                }
            }
        }
    }
}
