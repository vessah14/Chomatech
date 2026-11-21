using System.Collections.Concurrent;
using backend.Data;
using backend.Interfaces;
using backend.Models;
using backend.Services.Security;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace backend.Tests
{
    // Démarre la vraie API en mémoire sur une base PostgreSQL DÉDIÉE aux tests ("chomatech_test"),
    // recréée à chaque lancement à partir du modèle EF. La base de l'application n'est jamais
    // touchée. Brevo, Google et Facebook sont remplacés par des faux (aucun appel externe).
    public class ChomatechFactory : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private const string BaseDeTest = "chomatech_test";

        public FauxEmail Emails { get; } = new();
        public FauxNewsletter Newsletter { get; } = new();
        public FauxAuthExterne AuthExterne { get; } = new();

        // Exécuté avant la construction de l'hôte : Program.cs lit ces valeurs dès son démarrage,
        // les variables d'environnement passent devant appsettings et les user-secrets.
        static ChomatechFactory()
        {
            var secrets = new ConfigurationBuilder().AddUserSecrets<ChomatechFactory>().Build();
            var cs = secrets["ConnectionStrings:DefaultConnection"]
                ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection absent des user-secrets.");

            var csTest = new NpgsqlConnectionStringBuilder(cs) { Database = BaseDeTest }.ConnectionString;
            Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", csTest);
            Environment.SetEnvironmentVariable("RateLimiting__AuthPermitLimit", "100000");
            Environment.SetEnvironmentVariable("RateLimiting__PublicPermitLimit", "100000");
            Environment.SetEnvironmentVariable("RateLimiting__VuesPermitLimit", "100000");
            Environment.SetEnvironmentVariable("Brevo__ApiKey", "");
            Environment.SetEnvironmentVariable("SasPay__ApiKey", "sk_test_fake_1234567890");
            Environment.SetEnvironmentVariable("SasPay__BaseUrl", "https://api.saspay.me/api/v1/");
            Environment.SetEnvironmentVariable("SasPay__Country", "CM");
            Environment.SetEnvironmentVariable("SasPay__Currency", "XAF");
            Environment.SetEnvironmentVariable("App__SiteUrl", "http://localhost:5173");
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // Development : cookies sans "Secure" (le client de test est en http) + user-secrets (Jwt:Key).
            builder.UseEnvironment("Development");
            builder.ConfigureTestServices(services =>
            {
                services.AddSingleton<IEmailService>(Emails);
                services.AddSingleton<INewsletterSync>(Newsletter);
                services.AddSingleton<IExternalAuthService>(AuthExterne);
                services.AddSingleton<ISasPayGateway, FakeSasPayGateway>();
            });
        }

        public async Task InitializeAsync()
        {
            using var scope = Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Garde-fou : on ne supprime JAMAIS une autre base que celle des tests.
            var nomBase = new NpgsqlConnectionStringBuilder(db.Database.GetConnectionString()).Database;
            if (nomBase != BaseDeTest)
            {
                throw new InvalidOperationException($"Les tests refusent de tourner sur la base \"{nomBase}\".");
            }

            await db.Database.EnsureDeletedAsync();
            await db.Database.EnsureCreatedAsync();
        }

        Task IAsyncLifetime.DisposeAsync() => Task.CompletedTask;

        /* ───────── Jeux de données ───────── */

        public const string MotDePasse = "Mot-De-Passe-123";

        public static string EmailUnique(string prefixe = "test") => $"{prefixe}-{Guid.NewGuid():N}@example.com";

        public async Task<User> CreerUtilisateurAsync(string role = "Client", string? email = null)
        {
            using var scope = Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = new User
            {
                Id = Guid.NewGuid(),
                Nom = "Test",
                Prenom = role,
                Email = email ?? EmailUnique(role.ToLowerInvariant()),
                Password = PasswordHasher.Hash(MotDePasse),
                Role = role,
                CreatedAt = DateTimeOffset.UtcNow
            };
            db.Clients.Add(user);
            await db.SaveChangesAsync();
            return user;
        }

        public async Task<Produit> CreerProduitAsync(int stock, string statut = "Disponible", decimal montant = 1000)
        {
            using var scope = Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var produit = new Produit
            {
                Id = Guid.NewGuid(),
                NomProduit = $"Produit {Guid.NewGuid():N}"[..20],
                Categorie = "Ordinateur",
                Montant = montant,
                Stock = stock,
                Statut = statut,
                CreatedAt = DateTimeOffset.UtcNow
            };
            db.Produits.Add(produit);
            await db.SaveChangesAsync();
            return produit;
        }

        public async Task<int> StockAsync(Guid produitId)
        {
            using var scope = Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            return (await db.Produits.FindAsync(produitId))!.Stock;
        }

        public async Task<T> AvecDbAsync<T>(Func<AppDbContext, Task<T>> action)
        {
            using var scope = Services.CreateScope();
            return await action(scope.ServiceProvider.GetRequiredService<AppDbContext>());
        }

        // Session navigateur simulée (cookie géré à la main pour pouvoir l'inspecter / le rejouer).
        public ApiSession Session(string app = "client") =>
            new(CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false }), app);

        public async Task<ApiSession> ConnecterAsync(string email, string app = "client", bool rememberMe = false)
        {
            var session = Session(app);
            var reponse = await session.PostAsync("/api/auth/login", new { email, password = MotDePasse, rememberMe });
            reponse.EnsureSuccessStatusCode();
            return session;
        }
    }

    [CollectionDefinition(Nom)]
    public class ApiCollection : ICollectionFixture<ChomatechFactory>
    {
        public const string Nom = "API";
    }

    /* ───────── Faux services externes ───────── */

    public class FauxEmail : IEmailService
    {
        public ConcurrentQueue<EmailMessage> Envoyes { get; } = new();

        public Task<bool> EnvoyerAsync(EmailMessage message)
        {
            Envoyes.Enqueue(message);
            return Task.FromResult(true);
        }

        public EmailMessage? DernierPour(string email) =>
            Envoyes.LastOrDefault(m => m.DestinataireEmail.Equals(email, StringComparison.OrdinalIgnoreCase));
    }

    public class FauxNewsletter : INewsletterSync
    {
        public ConcurrentQueue<string> Ajouts { get; } = new();
        public ConcurrentQueue<string> Retraits { get; } = new();

        public Task AjouterAsync(string email) { Ajouts.Enqueue(email); return Task.CompletedTask; }
        public Task RetirerAsync(string email) { Retraits.Enqueue(email); return Task.CompletedTask; }
    }

    public class FauxAuthExterne : IExternalAuthService
    {
        // Profil que "Google/Facebook" renverra pour le prochain jeton vérifié.
        public ProfilExterne? Profil { get; set; }

        public Task<ProfilExterne> VerifierGoogleAsync(string accessToken) =>
            Task.FromResult(Profil ?? throw new InvalidOperationException("Profil non défini"));

        public Task<ProfilExterne> VerifierFacebookAsync(string accessToken) => VerifierGoogleAsync(accessToken);
    }

    public sealed class FakeSasPayGateway : ISasPayGateway
    {
        public Task<SasPayCheckoutSession> CreateCheckoutAsync(
            decimal amount,
            string currency,
            string country,
            string description,
            string customerEmail,
            string customerName,
            string returnUrl,
            Guid paymentId,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new SasPayCheckoutSession(
                $"session-{Guid.NewGuid():N}",
                $"https://pay.saspay.me/checkout/{Guid.NewGuid():N}"));
        }

        public Task<SasPayCheckoutStatus> GetCheckoutStatusAsync(
            string checkoutSessionId,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new SasPayCheckoutStatus("PAID", "SUCCESS"));
        }
    }
}
