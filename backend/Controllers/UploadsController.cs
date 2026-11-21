using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    // Réservé aux admins : c'est l'admin qui illustre les produits/services/annonces,
    // pas les clients.
    [ApiController]
    [Route("api/uploads")]
    [Authorize(Roles = "Admin")]
    public class UploadsController : ControllerBase
    {
        // Le Content-Type et le nom de fichier sont fournis par le client, donc falsifiables :
        // on identifie le format par ses premiers octets (signature) et on en déduit nous-mêmes
        // l'extension. Sinon un .html/.svg déclaré "image/png" serait servi tel quel par
        // UseStaticFiles (XSS stocké sur l'origine de l'API).
        private static readonly (string Extension, byte[] Signature, int Offset)[] Signatures =
        {
            (".jpg", new byte[] { 0xFF, 0xD8, 0xFF }, 0),
            (".png", new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }, 0),
            (".gif", "GIF8"u8.ToArray(), 0),
            (".webp", "WEBP"u8.ToArray(), 8) // "RIFF" + taille (4 octets) + "WEBP"
        };

        private const long MaxSizeBytes = 5 * 1024 * 1024; // 5 Mo

        private readonly IWebHostEnvironment _env;

        public UploadsController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost("produits")]
        public async Task<IActionResult> UploadProduitImage(IFormFile file)
        {
            var url = await EnregistrerImage(file, "produits");
            return url is null
                ? BadRequest(new { error = "Fichier image invalide (JPEG/PNG/WEBP/GIF, 5 Mo max)." })
                : Ok(new { url });
        }

        [HttpPost("realisations")]
        public async Task<IActionResult> UploadRealisationImage(IFormFile file)
        {
            var url = await EnregistrerImage(file, "realisations");
            return url is null
                ? BadRequest(new { error = "Fichier image invalide (JPEG/PNG/WEBP/GIF, 5 Mo max)." })
                : Ok(new { url });
        }

        private async Task<string?> EnregistrerImage(IFormFile? file, string dossier)
        {
            if (file is null || file.Length == 0) return null;
            if (file.Length > MaxSizeBytes) return null;

            var extension = await DetecterExtensionAsync(file);
            if (extension is null) return null;

            // Nom de fichier généré côté serveur : jamais le nom d'origine (évite les
            // collisions et toute tentative de path traversal via le nom fourni par le client).
            var nomFichier = $"{Guid.NewGuid()}{extension}";
            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var dossierComplet = Path.Combine(webRoot, "uploads", dossier);
            Directory.CreateDirectory(dossierComplet);

            var cheminComplet = Path.Combine(dossierComplet, nomFichier);
            await using (var stream = System.IO.File.Create(cheminComplet))
            {
                await file.CopyToAsync(stream);
            }

            return $"/uploads/{dossier}/{nomFichier}";
        }

        private static async Task<string?> DetecterExtensionAsync(IFormFile file)
        {
            var entete = new byte[12];
            await using var stream = file.OpenReadStream();
            var lus = await stream.ReadAtLeastAsync(entete, entete.Length, throwOnEndOfStream: false);

            foreach (var (extension, signature, offset) in Signatures)
            {
                if (lus >= offset + signature.Length &&
                    entete.AsSpan(offset, signature.Length).SequenceEqual(signature))
                {
                    // WEBP : vérifie aussi l'en-tête "RIFF" en tête de fichier.
                    if (extension == ".webp" && !entete.AsSpan(0, 4).SequenceEqual("RIFF"u8)) continue;
                    return extension;
                }
            }

            return null;
        }
    }
}
