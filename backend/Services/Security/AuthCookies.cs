namespace backend.Services.Security
{
    // Session dans un cookie HttpOnly : le JWT n'est plus jamais lisible par JavaScript, donc
    // une éventuelle faille XSS dans un front ne peut plus le voler (contrairement au localStorage).
    //
    // Deux cookies distincts, un par front (choisi par l'en-tête X-Chomatech-App) : sinon une
    // session client et une session admin ouvertes dans le même navigateur s'écraseraient.
    public static class AuthCookies
    {
        public const string AppHeader = "X-Chomatech-App";
        public const string AppAdmin = "admin";
        public const string AppClient = "client";

        private const string CookieAdmin = "chomatech_admin";
        private const string CookieClient = "chomatech_client";

        // "admin" ou "client" (défaut). Toute autre valeur est ramenée à "client".
        public static string App(HttpContext context) =>
            context.Request.Headers[AppHeader].ToString() == AppAdmin ? AppAdmin : AppClient;

        public static string? Lire(HttpContext context) =>
            context.Request.Cookies[NomCookie(App(context))];

        // persistant = "se souvenir de moi" : cookie avec date d'expiration (survit à la fermeture
        // du navigateur) ; sinon cookie de session, effacé à la fermeture.
        public static void Ecrire(HttpContext context, string token, DateTimeOffset expiration, bool persistant)
        {
            context.Response.Cookies.Append(NomCookie(App(context)), token, Options(context, persistant ? expiration : null));
        }

        public static void Effacer(HttpContext context)
        {
            context.Response.Cookies.Delete(NomCookie(App(context)), Options(context, null));
        }

        private static string NomCookie(string app) => app == AppAdmin ? CookieAdmin : CookieClient;

        private static CookieOptions Options(HttpContext context, DateTimeOffset? expiration)
        {
            var env = context.RequestServices.GetRequiredService<IHostEnvironment>();
            return new CookieOptions
            {
                HttpOnly = true,
                // Secure obligatoire en production (HTTPS) ; en dev, http://localhost.
                Secure = !env.IsDevelopment(),
                // Strict : jamais envoyé depuis un autre site (protection CSRF de base). Les fronts
                // et l'API doivent donc être sur le même site (ex. chomatech.cm / api.chomatech.cm).
                SameSite = SameSiteMode.Strict,
                Path = "/api",
                Expires = expiration
            };
        }
    }
}
