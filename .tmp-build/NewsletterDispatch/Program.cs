using System.Net.Http.Json;
using System.Text.Json;
using Npgsql;

const string titre = "Les actualités de CHOMA TECH";
const string categorie = "Actualités";
const string sujet = "Nouvelle annonce CHOMA TECH : Les actualités";
var cs = Environment.GetEnvironmentVariable("CHOMA_DB") ?? throw new InvalidOperationException("DB config absente");
var apiKey = Environment.GetEnvironmentVariable("CHOMA_BREVO_KEY") ?? throw new InvalidOperationException("Brevo config absente");
var sender = Environment.GetEnvironmentVariable("CHOMA_BREVO_SENDER") ?? throw new InvalidOperationException("Expediteur absent");
var emails = new List<string>();
Guid annonceId;
await using (var connection = new NpgsqlConnection(cs))
{
    await connection.OpenAsync();
    await using (var select = new NpgsqlCommand("SELECT email::text FROM \"Abonne_Newsletter\" ORDER BY created_at", connection))
    await using (var reader = await select.ExecuteReaderAsync())
    {
        while (await reader.ReadAsync()) emails.Add(reader.GetString(0));
    }
    if (emails.Count == 0)
    {
        Console.WriteLine("NO_SUBSCRIBERS");
        return;
    }
    await using var existing = new NpgsqlCommand("SELECT id FROM \"Annonce\" WHERE titre = @titre AND categorie = @categorie AND lower(statut) IN ('publiée','publiee') ORDER BY created_at DESC LIMIT 1", connection);
    existing.Parameters.AddWithValue("titre", titre);
    existing.Parameters.AddWithValue("categorie", categorie);
    var current = await existing.ExecuteScalarAsync();
    if (current is Guid id) annonceId = id;
    else
    {
        annonceId = Guid.NewGuid();
        await using var insert = new NpgsqlCommand("INSERT INTO \"Annonce\" (id,titre,categorie,statut,epingle,vues,created_at) VALUES (@id,@titre,@categorie,'Publiée',false,0,@created) ", connection);
        insert.Parameters.AddWithValue("id", annonceId);
        insert.Parameters.AddWithValue("titre", titre);
        insert.Parameters.AddWithValue("categorie", categorie);
        insert.Parameters.AddWithValue("created", DateTimeOffset.UtcNow);
        await insert.ExecuteNonQueryAsync();
    }
}
var ok = 0;
var failed = 0;
using var http = new HttpClient { BaseAddress = new Uri("https://api.brevo.com/v3/"), Timeout = TimeSpan.FromSeconds(20) };
foreach (var email in emails)
{
    using var request = new HttpRequestMessage(HttpMethod.Post, "smtp/email");
    request.Headers.Add("api-key", apiKey);
    request.Content = JsonContent.Create(new
    {
        sender = new { email = sender, name = "CHOMA TECH" },
        to = new[] { new { email } },
        subject = sujet,
        htmlContent = "<!doctype html><html lang=\"fr\"><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head><body style=\"margin:0;padding:0;background:#eef6fb;font-family:Arial,Helvetica,sans-serif;color:#102a43\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#eef6fb\"><tr><td align=\"center\" style=\"padding:28px 12px\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;background:#fff;border-radius:16px;overflow:hidden\"><tr><td bgcolor=\"#073b66\" style=\"padding:24px 30px;background:#073b66;border-bottom:4px solid #0ea5e9\"><div style=\"font-size:22px;font-weight:800;letter-spacing:1px;color:#fff\">CHOMA <span style=\"color:#38bdf8\">TECH</span></div><div style=\"margin-top:7px;font-size:12px;color:#dbeafe\">Innover aujourd’hui, impacter demain.</div></td></tr><tr><td style=\"padding:30px\"><h1 style=\"margin:0 0 18px;font-size:23px;color:#0f2942\">Une nouveauté à découvrir</h1><div style=\"font-size:15px;line-height:1.75;color:#334e68\"><p>Bonjour,</p><p>Les actualités de CHOMA TECH sont à découvrir sur notre site.</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:24px 0;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px\"><tr><td style=\"padding:20px\"><span style=\"display:inline-block;background:#dbeafe;color:#075985;padding:5px 10px;border-radius:20px;font-size:12px;font-weight:bold\">Actualités</span><h2 style=\"margin:14px 0 0;font-size:21px;color:#0f172a\">Les actualités de CHOMA TECH</h2></td></tr></table><p style=\"text-align:center;margin:28px 0\"><a href=\"https://chomatech.cm/annonces\" style=\"display:inline-block;background:#0284c7;color:#fff;padding:14px 26px;border-radius:9px;text-decoration:none;font-weight:bold\">Découvrir l’annonce</a></p><p style=\"font-size:13px;color:#64748b\">Vous recevez cette actualité car vous êtes inscrit à la newsletter CHOMA TECH. Pour gérer votre inscription, écrivez-nous à <a href=\"mailto:contact@chomatech.cm\" style=\"color:#0284c7\">contact@chomatech.cm</a>.</p></div></td></tr><tr><td style=\"padding:18px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;line-height:1.6;color:#64748b\">CHOMA TECH · Innover aujourd’hui, impacter demain.<br><a href=\"mailto:contact@chomatech.cm\" style=\"color:#0284c7;text-decoration:none\">contact@chomatech.cm</a></td></tr></table><div style=\"padding:14px 8px 0;font-size:11px;color:#94a3b8\">Vous recevez cet email de CHOMA TECH.</div></td></tr></table></body></html>",
        textContent = "Bonjour,\n\nLes actualités de CHOMA TECH sont à découvrir sur notre site.\n\nLes actualités de CHOMA TECH\nCatégorie : Actualités\n\nDécouvrir l’annonce : https://chomatech.cm/annonces\n\nVous recevez cette actualité car vous êtes inscrit à la newsletter CHOMA TECH. Pour gérer votre inscription, écrivez-nous à contact@chomatech.cm."
    });
    using var response = await http.SendAsync(request);
    if (response.IsSuccessStatusCode) ok++;
    else failed++;
}
Console.WriteLine(JsonSerializer.Serialize(new { AnnonceId = annonceId, Destinataires = emails.Count, EmailsAcceptes = ok, Echecs = failed }));
