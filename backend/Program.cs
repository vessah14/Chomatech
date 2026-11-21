using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using backend.Data;
using backend.Interfaces;
using backend.Middleware;
using backend.Services;
using backend.Services.Security;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.HttpOverrides;

// Doit exister AVANT WebApplication.CreateBuilder : sinon IWebHostEnvironment.WebRootFileProvider
// est initialisé sur un dossier absent et UseStaticFiles() ne voit jamais les fichiers créés
// après coup par UploadsController, même une fois le dossier réellement présent sur disque.
Directory.CreateDirectory(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads"));

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProduitService, ProduitService>();
builder.Services.AddScoped<IServiceService, ServiceService>();
builder.Services.AddScoped<IDemandeProduitService, DemandeProduitService>();
builder.Services.AddScoped<IDemandeServiceService, DemandeServiceService>();
builder.Services.AddScoped<IAnnonceService, AnnonceService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IFaqService, FaqService>();
builder.Services.AddScoped<IKnowledgebaseService, KnowledgebaseService>();
builder.Services.AddScoped<IChatbotService, ChatbotService>();
builder.Services.AddScoped<IConversationService, ConversationService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IAvisService, AvisService>();
builder.Services.AddScoped<IParametreService, ParametreService>();
builder.Services.AddScoped<IRealisationService, RealisationService>();
builder.Services.AddScoped<IMessageContactService, MessageContactService>();
builder.Services.AddScoped<INewsletterService, NewsletterService>();
builder.Services.AddScoped<IExternalAuthService, ExternalAuthService>();
builder.Services.AddScoped<IPaiementService, PaiementService>();
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<ISasPayGateway, SasPayGateway>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["SasPay:BaseUrl"] ?? "https://api.saspay.me/api/v1/");
    client.Timeout = TimeSpan.FromSeconds(20);
});

// Brevo : un seul service pour l'envoi d'emails et la synchronisation de la liste newsletter.
builder.Services.AddHttpClient(BrevoService.HttpClientName, client =>
{
    client.BaseAddress = new Uri("https://api.brevo.com/v3/");
    client.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddScoped<BrevoService>();
builder.Services.AddScoped<IEmailService>(sp => sp.GetRequiredService<BrevoService>());
builder.Services.AddScoped<INewsletterSync>(sp => sp.GetRequiredService<BrevoService>());

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    // Une seule policy nommée pour les deux front-ends React (frontend/ et Administration/).
    // AllowCredentials : nécessaire pour que le navigateur envoie le cookie de session.
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// Garde-fous de production : refuse de démarrer avec une configuration ouverte, plutôt que de
// tourner silencieusement en mode non sécurisé.
if (builder.Environment.IsProduction())
{
    if (allowedOrigins.Length == 0 || allowedOrigins.Any(o => !o.StartsWith("https://", StringComparison.OrdinalIgnoreCase)))
    {
        throw new InvalidOperationException(
            "Production : Cors:AllowedOrigins doit lister les domaines des fronts, en https:// uniquement " +
            "(ex. variables Cors__AllowedOrigins__0=https://chomatech.cm, Cors__AllowedOrigins__1=https://admin.chomatech.cm).");
    }

    var allowedHosts = builder.Configuration["AllowedHosts"];
    if (string.IsNullOrWhiteSpace(allowedHosts) || allowedHosts.Trim() == "*")
    {
        throw new InvalidOperationException(
            "Production : AllowedHosts ne doit pas valoir \"*\" (ex. variable AllowedHosts=api.chomatech.cm).");
    }
}

// Derrière un reverse proxy (Nginx, IIS, hébergeur), toutes les requêtes semblent venir de l'IP
// du proxy : la limite par IP bloquerait tout le monde d'un coup. On fait alors confiance à
// X-Forwarded-For / X-Forwarded-Proto, mais UNIQUEMENT venant des proxys déclarés ici (sinon
// n'importe qui pourrait usurper son IP via cet en-tête et contourner la limite).
// KnownNetworks (plages CIDR) : utile quand l'IP du proxy change, ex. nginx dans Docker.
var proxysConnus = builder.Configuration.GetSection("ReverseProxy:KnownProxies").Get<string[]>()
    ?? Array.Empty<string>();
var reseauxProxy = builder.Configuration.GetSection("ReverseProxy:KnownNetworks").Get<string[]>()
    ?? Array.Empty<string>();
var derriereProxy = proxysConnus.Length > 0 || reseauxProxy.Length > 0;
if (derriereProxy)
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownIPNetworks.Clear();
        options.KnownProxies.Clear();
        foreach (var ip in proxysConnus)
        {
            options.KnownProxies.Add(System.Net.IPAddress.Parse(ip));
        }
        foreach (var reseau in reseauxProxy)
        {
            options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse(reseau));
        }
    });
}

builder.Services.AddMemoryCache();
builder.Services.AddSingleton<LoginLockout>();

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "Jwt:Key manquant dans la configuration. En local : dotnet user-secrets set \"Jwt:Key\" \"...\". " +
        "En production : variable d'environnement Jwt__Key.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Sans ça, le handler JWT remappe silencieusement "sub" vers ClaimTypes.NameIdentifier
        // (et d'autres claims standards vers leurs URI XML historiques). On garde les noms de
        // claims tels qu'on les a écrits (JwtRegisteredClaimNames.Sub, etc.) pour que la lecture
        // côté Controllers (User.FindFirstValue(JwtRegisteredClaimNames.Sub)) soit prévisible.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };

        options.Events = new JwtBearerEvents
        {
            // Jeton lu dans le cookie HttpOnly du front appelant (voir AuthCookies). Un en-tête
            // "Authorization: Bearer" reste accepté (outils, tests) : il est prioritaire.
            OnMessageReceived = context =>
            {
                if (string.IsNullOrEmpty(context.Request.Headers.Authorization))
                {
                    context.Token = AuthCookies.Lire(context.HttpContext);
                }
                return Task.CompletedTask;
            },

            OnTokenValidated = async context =>
            {
                var principal = context.Principal!;

                // Les jetons de réinitialisation de mot de passe sont signés avec la même clé :
                // sans ce filtre, un lien de réinitialisation servirait aussi de session valide.
                if (principal.HasClaim(c => c.Type == AuthService.PurposeClaim))
                {
                    context.Fail("Ce jeton n'est pas un jeton d'accès.");
                    return;
                }

                // Révocation : le jeton n'est valable que si le compte existe encore, que son mot
                // de passe n'a pas changé (empreinte pwd_stamp) et que son rôle est le même qu'à
                // l'émission. Changer de mot de passe déconnecte donc tous les appareils, et un
                // admin rétrogradé ou supprimé perd l'accès immédiatement.
                if (!Guid.TryParse(principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var userId))
                {
                    context.Fail("Jeton invalide.");
                    return;
                }

                var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                var compte = await db.Clients
                    .Where(u => u.Id == userId)
                    .Select(u => new { u.Password, u.Role })
                    .SingleOrDefaultAsync();

                if (compte is null ||
                    principal.FindFirst(AuthService.PasswordStampClaim)?.Value != AuthService.PasswordStamp(compte.Password) ||
                    !principal.IsInRole(compte.Role))
                {
                    context.Fail("Session révoquée.");
                }
            }
        };
    });

builder.Services.AddAuthorization();

// Anti brute-force : limite par IP sur les endpoints d'authentification (login, signup,
// demande/reset de mot de passe). Ces routes n'exigent pas de token, donc rien d'autre ne
// les protège d'un script qui enchaîne les tentatives.
// Limites réglables par configuration (RateLimiting:*), valeurs par défaut ci-dessous ; les tests
// d'intégration les relèvent pour pouvoir enchaîner de nombreuses connexions.
var limiteAuth = builder.Configuration.GetValue<int?>("RateLimiting:AuthPermitLimit") ?? 10;
var limiteVues = builder.Configuration.GetValue<int?>("RateLimiting:VuesPermitLimit") ?? 30;
var limitePublic = builder.Configuration.GetValue<int?>("RateLimiting:PublicPermitLimit") ?? 5;
var limiteChatbot = builder.Configuration.GetValue<int?>("RateLimiting:ChatbotPermitLimit") ?? 20;

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = limiteAuth,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // Compteur de vues des annonces : large pour une navigation normale, mais empêche un
    // script de gonfler artificiellement les vues.
    options.AddPolicy("vues", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = limiteVues,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // Formulaires publics anonymes (newsletter, contact) : même principe, contre le spam scripté.
    options.AddPolicy("public", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = limitePublic,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    options.AddPolicy("chatbot", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = limiteChatbot,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    options.OnRejected = (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        return new ValueTask(context.HttpContext.Response.WriteAsJsonAsync(
            new { error = "Trop de tentatives. Réessayez dans quelques instants." },
            cancellationToken));
    };
});

var app = builder.Build();

// En premier : l'IP réelle du client doit être connue avant la limite par IP et les logs.
if (derriereProxy)
{
    app.UseForwardedHeaders();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandlingMiddleware();

if (!app.Environment.IsDevelopment())
{
    // Force le navigateur à rester en HTTPS sur ce domaine (en dev, gênerait http://localhost).
    app.UseHsts();
}

// En-têtes de sécurité : l'API ne sert que du JSON et des images, donc aucune page de cette
// origine ne doit exécuter de script, être encadrée (clickjacking) ni voir son type deviné.
// Défense en profondeur pour /uploads, en plus du contrôle de signature à l'upload.
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["Referrer-Policy"] = "no-referrer";
    headers["Content-Security-Policy"] = "default-src 'none'; img-src 'self'; frame-ancestors 'none'";
    await next();
});

app.UseHttpsRedirection();

// Sert les fichiers sous wwwroot/uploads (images produits/services/annonces) — public en
// lecture, l'upload lui-même reste protégé par UploadsController ([Authorize(Roles="Admin")]).
app.UseStaticFiles();

app.UseCors("Frontend");

// Protection CSRF (la session est un cookie, envoyé automatiquement par le navigateur) : toute
// requête qui modifie des données doit porter l'en-tête X-Chomatech-App. Un en-tête personnalisé
// déclenche un "preflight" CORS, qu'un site tiers non autorisé ne peut pas passer : un formulaire
// piégé ou une image ailleurs ne peut donc rien déclencher au nom de l'utilisateur.
app.Use(async (context, next) =>
{
    var methodeSure = HttpMethods.IsGet(context.Request.Method) || HttpMethods.IsHead(context.Request.Method)
        || HttpMethods.IsOptions(context.Request.Method);

    var estWebhookSasPay = context.Request.Path.StartsWithSegments("/api/paiements/webhooks");

    if (!methodeSure && context.Request.Path.StartsWithSegments("/api")
        && !estWebhookSasPay
        && !context.Request.Headers.ContainsKey(AuthCookies.AppHeader))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new { error = "Requête refusée (en-tête X-Chomatech-App manquant)." });
        return;
    }

    await next();
});

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await AdminBootstrap.ExecuterAsync(app);

app.Run();

// Rend la classe Program visible du projet de tests (WebApplicationFactory<Program>).
public partial class Program { }
