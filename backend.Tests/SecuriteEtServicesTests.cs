using System.Net;
using System.Net.Http.Headers;
using backend.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace backend.Tests
{
    [Collection(ApiCollection.Nom)]
    public class SecuriteEtServicesTests
    {
        private readonly ChomatechFactory _app;

        public SecuriteEtServicesTests(ChomatechFactory app)
        {
            _app = app;
        }

        [Fact]
        public async Task Les_reponses_portent_les_en_tetes_de_securite()
        {
            var r = await _app.Session().GetAsync("/api/faqs");

            Assert.Equal("nosniff", r.Headers.GetValues("X-Content-Type-Options").Single());
            Assert.Equal("DENY", r.Headers.GetValues("X-Frame-Options").Single());
            Assert.Contains("default-src 'none'", r.Headers.GetValues("Content-Security-Policy").Single());
        }

        [Fact]
        public async Task Les_routes_admin_refusent_un_visiteur_anonyme()
        {
            var anonyme = _app.Session();

            Assert.Equal(HttpStatusCode.Unauthorized, (await anonyme.GetAsync("/api/users")).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await anonyme.GetAsync("/api/messages-contact")).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await anonyme.GetAsync("/api/newsletter")).StatusCode);
        }

        private static MultipartFormDataContent Fichier(byte[] contenu, string nom, string typeDeclare)
        {
            var fichier = new ByteArrayContent(contenu);
            fichier.Headers.ContentType = new MediaTypeHeaderValue(typeDeclare);
            return new MultipartFormDataContent { { fichier, "file", nom } };
        }

        [Fact]
        public async Task Upload_refuse_un_fichier_HTML_deguise_en_image()
        {
            var admin = await _app.CreerUtilisateurAsync("Admin");
            var session = await _app.ConnecterAsync(admin.Email, "admin");
            var html = "<html><script>alert(document.cookie)</script></html>"u8.ToArray();

            var r = await session.EnvoyerAsync(HttpMethod.Post, "/api/uploads/produits", null,
                Fichier(html, "piege.html", "image/png"));

            Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        }

        [Fact]
        public async Task Upload_accepte_un_vrai_PNG_et_le_sert_avec_nosniff()
        {
            var admin = await _app.CreerUtilisateurAsync("Admin");
            var session = await _app.ConnecterAsync(admin.Email, "admin");
            // Plus petit PNG valide (1x1 pixel).
            var png = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");

            var r = await session.EnvoyerAsync(HttpMethod.Post, "/api/uploads/produits", null,
                Fichier(png, "photo.exe", "application/octet-stream")); // nom/type mensongers : seul le contenu compte

            Assert.Equal(HttpStatusCode.OK, r.StatusCode);
            var url = (await ApiSession.JsonAsync(r)).GetProperty("url").GetString()!;
            Assert.EndsWith(".png", url);

            var image = await _app.CreateClient().GetAsync(url);
            Assert.Equal(HttpStatusCode.OK, image.StatusCode);
            Assert.Equal("nosniff", image.Headers.GetValues("X-Content-Type-Options").Single());

            // Ménage : le fichier de test est écrit dans le vrai wwwroot du backend.
            var webRoot = _app.Services.GetRequiredService<IWebHostEnvironment>().WebRootPath;
            File.Delete(Path.Combine(webRoot, url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar)));
        }

        [Fact]
        public async Task Upload_reserve_aux_admins()
        {
            var client = await _app.CreerUtilisateurAsync();
            var session = await _app.ConnecterAsync(client.Email);

            var r = await session.EnvoyerAsync(HttpMethod.Post, "/api/uploads/produits", null,
                Fichier(new byte[] { 0x89, 0x50, 0x4E, 0x47 }, "a.png", "image/png"));

            Assert.Equal(HttpStatusCode.Forbidden, r.StatusCode);
        }

        [Fact]
        public async Task Newsletter_double_inscription_une_seule_ligne_et_une_seule_synchro_Brevo()
        {
            var email = ChomatechFactory.EmailUnique("abonne");
            var session = _app.Session();

            Assert.Equal(HttpStatusCode.OK, (await session.PostAsync("/api/newsletter", new { email })).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await session.PostAsync("/api/newsletter", new { email })).StatusCode);

            var lignes = await _app.AvecDbAsync(db => db.AbonnesNewsletter.CountAsync(a => a.Email == email));
            Assert.Equal(1, lignes);
            Assert.Equal(1, _app.Newsletter.Ajouts.Count(e => e == email));
        }

        [Fact]
        public async Task Annonce_publiee_notifie_les_abonnes_une_seule_fois()
        {
            var email = ChomatechFactory.EmailUnique("annonce");
            await _app.Session().PostAsync("/api/newsletter", new { email });
            var admin = await _app.CreerUtilisateurAsync("Admin");
            var session = await _app.ConnecterAsync(admin.Email, "admin");

            var creee = await session.PostAsync("/api/annonces", new
            {
                titre = "Nouveau service",
                categorie = "Actualité",
                statut = "Publiée",
                epingle = false
            });

            Assert.Equal(HttpStatusCode.Created, creee.StatusCode);
            var emailAnnonce = _app.Emails.DernierPour(email);
            Assert.NotNull(emailAnnonce);
            Assert.Contains("Nouveau service", emailAnnonce!.Html);
            Assert.Contains("/annonces", emailAnnonce.Html);
        }

        [Fact]
        public async Task Campagne_newsletter_est_envoyee_aux_abonnes_actifs()
        {
            var email = ChomatechFactory.EmailUnique("campagne");
            await _app.Session().PostAsync("/api/newsletter", new { email });
            var admin = await _app.CreerUtilisateurAsync("Admin");
            var session = await _app.ConnecterAsync(admin.Email, "admin");

            var reponse = await session.PostAsync("/api/newsletter/envoyer", new
            {
                sujet = "Actualités CHOMA TECH",
                contenu = "Bonjour les abonnés"
            });

            Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
            Assert.Equal("Actualités CHOMA TECH", _app.Emails.DernierPour(email)!.Sujet);
        }

        [Fact]
        public async Task Desinscription_par_l_admin_retire_aussi_de_Brevo()
        {
            var admin = await _app.CreerUtilisateurAsync("Admin");
            var sessionAdmin = await _app.ConnecterAsync(admin.Email, "admin");
            var email = ChomatechFactory.EmailUnique("abonne");
            await _app.Session().PostAsync("/api/newsletter", new { email });
            var id = await _app.AvecDbAsync(db => db.AbonnesNewsletter.Where(a => a.Email == email).Select(a => a.Id).SingleAsync());

            var r = await sessionAdmin.DeleteAsync($"/api/newsletter/{id}");

            Assert.Equal(HttpStatusCode.NoContent, r.StatusCode);
            Assert.Contains(email, _app.Newsletter.Retraits);
        }

        [Fact]
        public async Task Message_de_contact_notifie_l_entreprise_avec_un_contenu_encode()
        {
            var visiteur = ChomatechFactory.EmailUnique("visiteur");

            var r = await _app.Session().PostAsync("/api/messages-contact", new
            {
                nomComplet = "<b>Pirate</b>",
                email = visiteur,
                message = "Bonjour <script>alert(1)</script>"
            });

            Assert.Equal(HttpStatusCode.Created, r.StatusCode);
            var notification = _app.Emails.Envoyes.Last(m => m.RepondreA == visiteur);
            Assert.DoesNotContain("<script>", notification.Html);
            Assert.Contains("&lt;script&gt;", notification.Html);
            Assert.Equal(visiteur, notification.RepondreA); // "Répondre" écrit au visiteur
        }

        [Fact]
        public async Task Les_parametres_sont_publics_en_lecture_mais_pas_en_ecriture()
        {
            var anonyme = _app.Session();

            Assert.Equal(HttpStatusCode.OK, (await anonyme.GetAsync("/api/parametres")).StatusCode);
            var ecriture = await anonyme.PutAsync("/api/parametres", new
            {
                nomEntreprise = "Pirate", slogan = "x", email = "p@example.com", telephone = "1", adresse = "x"
            });
            Assert.Equal(HttpStatusCode.Unauthorized, ecriture.StatusCode);
        }
    }
}
