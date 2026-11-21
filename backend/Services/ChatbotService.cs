using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using backend.Data;
using backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public sealed class ChatbotService : IChatbotService
    {
        private static readonly HashSet<string> MotsVides = new(StringComparer.Ordinal)
        {
            "avec", "dans", "des", "est", "les", "mais", "mon", "pour", "que", "quel", "quelle",
            "quels", "quelles", "qui", "sur", "une", "vous", "votre", "vos", "nous", "notre",
            "the", "and", "are", "can", "for", "how", "is", "our", "please", "what", "when",
            "where", "which", "who", "with", "you", "your", "this", "that"
        };

        private readonly AppDbContext _db;

        public ChatbotService(AppDbContext db) => _db = db;

        public async Task<ChatbotAnswer> RepondreAsync(string question, CancellationToken cancellationToken = default)
        {
            var questionNormalisee = Normaliser(question.Trim());
            if (EstSalutation(questionNormalisee))
            {
                return new ChatbotAnswer(
                    "Bonjour ! Je suis l’assistant CHOMA TECH. Posez-moi une question sur nos produits, nos services ou nos informations pratiques.",
                    null,
                    false);
            }

            var motsQuestion = ExtraireMots(questionNormalisee)
                .Where(mot => mot.Length > 2 && !MotsVides.Contains(mot))
                .Distinct()
                .ToArray();

            var entries = await _db.Knowledgebases
                .AsNoTracking()
                .Select(entry => new { entry.Titre, entry.Contenu })
                .ToListAsync(cancellationToken);

            var meilleur = entries
                .Select(entry =>
                {
                    var motsTitre = ExtraireMots(Normaliser(entry.Titre)).ToHashSet(StringComparer.Ordinal);
                    var motsContenu = ExtraireMots(Normaliser(entry.Contenu)).ToHashSet(StringComparer.Ordinal);
                    var correspondancesTitre = motsQuestion.Count(motsTitre.Contains);
                    var correspondancesContenu = motsQuestion.Count(motsContenu.Contains);
                    var phraseCorrespond = questionNormalisee.Contains(Normaliser(entry.Titre), StringComparison.Ordinal);
                    // Les questions courtes comme « paiement » doivent aussi trouver
                    // une fiche dont le sujet apparaît dans le contenu, même si le titre
                    // est formulé autrement.
                    var score = correspondancesTitre * 4d + correspondancesContenu * 1.5d + (phraseCorrespond ? 4d : 0d);
                    return new { Entry = entry, CorrespondancesTitre = correspondancesTitre, Score = score };
                })
                .Where(result => result.Score > 0)
                .OrderByDescending(result => result.Score)
                .FirstOrDefault();

            if (meilleur is null)
            {
                return new ChatbotAnswer(
                    "Je n’ai pas trouvé cette information dans ma base. Reformulez votre question ou contactez notre équipe depuis la page Contact.",
                    null,
                    false);
            }

            return new ChatbotAnswer(meilleur.Entry.Contenu, meilleur.Entry.Titre, true);
        }

        private static bool EstSalutation(string message) =>
            message is "bonjour" or "bonsoir" or "salut" or "hello" or "hi" or "hey";

        private static IEnumerable<string> ExtraireMots(string value) =>
            Regex.Split(value, @"[^a-z0-9]+", RegexOptions.CultureInvariant)
                .Select(CanonicaliserMot)
                .Where(mot => mot.Length > 0);

        private static string CanonicaliserMot(string mot)
        {
            // « Paiement » et « payement » se prononcent de la même façon. On
            // ramène les deux graphies à la forme correcte pour que la recherche
            // retrouve les fiches de la base même si l'une contient la variante.
            var singulier = mot.Length > 4 && mot.EndsWith('s') ? mot[..^1] : mot;
            return singulier == "payement" ? "paiement" : singulier;
        }

        private static string Normaliser(string value)
        {
            var decompose = value.ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var sansAccents = new string(decompose
                .Where(caractere => CharUnicodeInfo.GetUnicodeCategory(caractere) != UnicodeCategory.NonSpacingMark)
                .ToArray());
            return sansAccents.Normalize(NormalizationForm.FormC);
        }
    }
}
