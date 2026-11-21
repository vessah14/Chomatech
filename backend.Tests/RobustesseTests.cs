using System.Net;

namespace backend.Tests
{
    // Cas limites qui produisaient des erreurs 500 : doublons simultanés et textes plus longs que
    // les colonnes de la base de production (limites mesurées sur la vraie base).
    [Collection(ApiCollection.Nom)]
    public class RobustesseTests
    {
        private readonly ChomatechFactory _app;

        public RobustesseTests(ChomatechFactory app)
        {
            _app = app;
        }

        [Fact]
        public async Task Inscriptions_simultanees_avec_le_meme_email_jamais_d_erreur_500()
        {
            var email = ChomatechFactory.EmailUnique("course");

            var reponses = await Task.WhenAll(Enumerable.Range(0, 6).Select(_ =>
                _app.Session().PostAsync("/api/auth/signup",
                    new { nom = "Course", prenom = "Test", email, password = ChomatechFactory.MotDePasse })));

            Assert.DoesNotContain(reponses, r => r.StatusCode == HttpStatusCode.InternalServerError);
            Assert.Single(reponses, r => r.StatusCode == HttpStatusCode.Created);
            Assert.All(reponses.Where(r => r.StatusCode != HttpStatusCode.Created),
                r => Assert.Equal(HttpStatusCode.Conflict, r.StatusCode));
        }

        [Fact]
        public async Task Budget_de_contact_trop_long_renvoie_400_et_non_500()
        {
            var r = await _app.Session().PostAsync("/api/messages-contact", new
            {
                nomComplet = "Visiteur",
                email = ChomatechFactory.EmailUnique("visiteur"),
                budget = new string('9', 300), // colonne limitée à 250 en base
                message = "Bonjour, un devis svp."
            });

            Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        }

        [Fact]
        public async Task Lien_de_realisation_trop_long_renvoie_400()
        {
            var admin = await _app.CreerUtilisateurAsync("Admin");
            var session = await _app.ConnecterAsync(admin.Email, "admin");

            var r = await session.PostAsync("/api/realisations", new
            {
                titre = "Projet",
                categorie = "Web",
                technologies = "React",
                lien = "https://example.com/" + new string('a', 600) // colonne limitée à 500
            });

            Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        }

        [Fact]
        public async Task Supprimer_un_produit_deja_commande_renvoie_409()
        {
            var admin = await _app.CreerUtilisateurAsync("Admin");
            var client = await _app.CreerUtilisateurAsync();
            var produit = await _app.CreerProduitAsync(stock: 5);
            var sessionClient = await _app.ConnecterAsync(client.Email);
            var sessionAdmin = await _app.ConnecterAsync(admin.Email, "admin");
            await sessionClient.PostAsync("/api/demandes-produits/lot",
                new { lignes = new[] { new { produitId = produit.Id, quantite = 1 } } });

            var r = await sessionAdmin.DeleteAsync($"/api/produits/{produit.Id}");

            Assert.Equal(HttpStatusCode.Conflict, r.StatusCode);
        }
    }
}
