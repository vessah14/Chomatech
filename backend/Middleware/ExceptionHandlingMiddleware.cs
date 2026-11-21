using System.Net;
using backend.Services.Exceptions;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace backend.Middleware
{
    // Traduit les exceptions métier (backend.Services.Exceptions) en réponses HTTP,
    // pour que les Controllers restent fins et n'aient pas à répéter des try/catch.
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                // Contraintes de la base violées : erreurs prévisibles (doublon sur deux requêtes
                // simultanées, élément encore référencé, texte plus long que la colonne). On les
                // traduit en message clair plutôt qu'en 500, même là où le code ne les attend pas.
                if (ErreurBaseDeDonnees(ex) is var (code, texte) && code != 0)
                {
                    _logger.LogWarning(ex, "Contrainte de base de données violée");
                    context.Response.ContentType = "application/json";
                    context.Response.StatusCode = (int)code;
                    await context.Response.WriteAsJsonAsync(new { error = texte });
                    return;
                }

                var statusCode = ex switch
                {
                    NotFoundException => HttpStatusCode.NotFound,
                    ConflictException => HttpStatusCode.Conflict,
                    UnauthorizedAppException => HttpStatusCode.Unauthorized,
                    BadRequestException => HttpStatusCode.BadRequest,
                    ServiceUnavailableException => HttpStatusCode.ServiceUnavailable,
                    ForbiddenException => HttpStatusCode.Forbidden,
                    TooManyRequestsException => HttpStatusCode.TooManyRequests,
                    _ => HttpStatusCode.InternalServerError
                };

                if (statusCode == HttpStatusCode.InternalServerError)
                {
                    _logger.LogError(ex, "Erreur non gérée");
                }

                var message = statusCode == HttpStatusCode.InternalServerError
                    ? "Une erreur interne est survenue."
                    : ex.Message;

                context.Response.ContentType = "application/json";
                context.Response.StatusCode = (int)statusCode;
                await context.Response.WriteAsJsonAsync(new { error = message });
            }
        }

        // Codes SQLSTATE PostgreSQL : https://www.postgresql.org/docs/current/errcodes-appendix.html
        private static (HttpStatusCode Code, string Message) ErreurBaseDeDonnees(Exception ex)
        {
            var pg = (ex as DbUpdateException)?.InnerException as PostgresException ?? ex as PostgresException;
            return pg?.SqlState switch
            {
                PostgresErrorCodes.UniqueViolation =>
                    (HttpStatusCode.Conflict, "Cet élément existe déjà (valeur en double)."),
                PostgresErrorCodes.ForeignKeyViolation =>
                    (HttpStatusCode.Conflict, "Opération impossible : cet élément est lié à d'autres données."),
                PostgresErrorCodes.StringDataRightTruncation =>
                    (HttpStatusCode.BadRequest, "Un des textes saisis est trop long."),
                PostgresErrorCodes.CheckViolation or PostgresErrorCodes.NotNullViolation =>
                    (HttpStatusCode.BadRequest, "Données invalides."),
                _ => (0, string.Empty)
            };
        }
    }

    public static class ExceptionHandlingMiddlewareExtensions
    {
        public static IApplicationBuilder UseExceptionHandlingMiddleware(this IApplicationBuilder app)
        {
            return app.UseMiddleware<ExceptionHandlingMiddleware>();
        }
    }
}
