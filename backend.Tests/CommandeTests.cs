using System.Net;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Tests
{
    [Collection(ApiCollection.Nom)]
    public class CommandeTests
    {
        private readonly ChomatechFactory _app;

        public CommandeTests(ChomatechFactory app)
        {
            _app = app;
        }

        private Task<int> NbCommandesAsync(Guid clientId) =>
            _app.AvecDbAsync(db => db.DemandesProduits.CountAsync(d => d.ClientId == clientId));

        [Fact]
        public async Task Commande_du_panier_decremente_le_stock()
        {
            var client = await _app.CreerUtilisateurAsync();
            var produit = await _app.CreerProduitAsync(stock: 5);
            var session = await _app.ConnecterAsync(client.Email);

            var r = await session.PostAsync("/api/demandes-produits/lot",
                new { lignes = new[] { new { produitId = produit.Id, quantite = 2 } } });

            Assert.Equal(HttpStatusCode.OK, r.StatusCode);
            Assert.Equal(3, await _app.StockAsync(produit.Id));
        }

        [Fact]
        public async Task Panier_avec_un_produit_en_rupture_ne_cree_rien_tout_ou_rien()
        {
            var client = await _app.CreerUtilisateurAsync();
            var disponible = await _app.CreerProduitAsync(stock: 5);
            var presqueVide = await _app.CreerProduitAsync(stock: 1);
            var session = await _app.ConnecterAsync(client.Email);

            var r = await session.PostAsync("/api/demandes-produits/lot", new
            {
                lignes = new[]
                {
                    new { produitId = disponible.Id, quantite = 2 },
                    new { produitId = presqueVide.Id, quantite = 3 }
                }
            });

            Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
            Assert.Equal(5, await _app.StockAsync(disponible.Id)); // rien n'a été retiré
            Assert.Equal(1, await _app.StockAsync(presqueVide.Id));
            Assert.Equal(0, await NbCommandesAsync(client.Id)); // aucune commande partielle
        }

        [Fact]
        public async Task Commandes_simultanees_ne_vendent_jamais_plus_que_le_stock()
        {
            var produit = await _app.CreerProduitAsync(stock: 3);
            var sessions = new List<ApiSession>();
            for (var i = 0; i < 8; i++)
            {
                var c = await _app.CreerUtilisateurAsync();
                sessions.Add(await _app.ConnecterAsync(c.Email));
            }

            var reponses = await Task.WhenAll(sessions.Select(s => s.PostAsync("/api/demandes-produits/lot",
                new { lignes = new[] { new { produitId = produit.Id, quantite = 1 } } })));

            Assert.Equal(3, reponses.Count(r => r.StatusCode == HttpStatusCode.OK));
            Assert.Equal(0, await _app.StockAsync(produit.Id));
        }

        [Fact]
        public async Task Annuler_rend_le_stock_et_desannuler_le_reprend()
        {
            var admin = await _app.CreerUtilisateurAsync("Admin");
            var client = await _app.CreerUtilisateurAsync();
            var produit = await _app.CreerProduitAsync(stock: 4);
            var sessionClient = await _app.ConnecterAsync(client.Email);
            var sessionAdmin = await _app.ConnecterAsync(admin.Email, "admin");

            var commande = await ApiSession.JsonAsync(await sessionClient.PostAsync("/api/demandes-produits/lot",
                new { lignes = new[] { new { produitId = produit.Id, quantite = 3 } } }));
            var id = commande[0].GetProperty("id").GetGuid();
            Assert.Equal(1, await _app.StockAsync(produit.Id));

            await sessionAdmin.PatchAsync($"/api/demandes-produits/{id}/statut", new { statut = "Annulée" });
            Assert.Equal(4, await _app.StockAsync(produit.Id));

            await sessionAdmin.PatchAsync($"/api/demandes-produits/{id}/statut", new { statut = "En cours" });
            Assert.Equal(1, await _app.StockAsync(produit.Id));
        }

        [Fact]
        public async Task Supprimer_une_commande_non_livree_rend_le_stock()
        {
            var admin = await _app.CreerUtilisateurAsync("Admin");
            var client = await _app.CreerUtilisateurAsync();
            var produit = await _app.CreerProduitAsync(stock: 4);
            var sessionClient = await _app.ConnecterAsync(client.Email);
            var sessionAdmin = await _app.ConnecterAsync(admin.Email, "admin");

            var commande = await ApiSession.JsonAsync(await sessionClient.PostAsync("/api/demandes-produits/lot",
                new { lignes = new[] { new { produitId = produit.Id, quantite = 2 } } }));

            var r = await sessionAdmin.DeleteAsync($"/api/demandes-produits/{commande[0].GetProperty("id").GetGuid()}");

            Assert.Equal(HttpStatusCode.NoContent, r.StatusCode);
            Assert.Equal(4, await _app.StockAsync(produit.Id));
        }

        [Fact]
        public async Task Statut_de_commande_inconnu_refuse()
        {
            var admin = await _app.CreerUtilisateurAsync("Admin");
            var sessionAdmin = await _app.ConnecterAsync(admin.Email, "admin");

            var r = await sessionAdmin.PatchAsync($"/api/demandes-produits/{Guid.NewGuid()}/statut", new { statut = "N'importe quoi" });

            Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        }

        [Fact]
        public async Task Un_produit_archive_ne_peut_pas_etre_commande()
        {
            var client = await _app.CreerUtilisateurAsync();
            var produit = await _app.CreerProduitAsync(stock: 10, statut: "Archivé");
            var session = await _app.ConnecterAsync(client.Email);

            var r = await session.PostAsync("/api/demandes-produits/lot",
                new { lignes = new[] { new { produitId = produit.Id, quantite = 1 } } });

            Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
            Assert.Equal(10, await _app.StockAsync(produit.Id));
        }

        [Fact]
        public async Task Un_client_ne_voit_pas_les_commandes_d_un_autre()
        {
            var alice = await _app.CreerUtilisateurAsync();
            var bob = await _app.CreerUtilisateurAsync();
            var sessionBob = await _app.ConnecterAsync(bob.Email);

            Assert.Equal(HttpStatusCode.Forbidden, (await sessionBob.GetAsync($"/api/demandes-produits?clientId={alice.Id}")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await sessionBob.GetAsync("/api/demandes-produits")).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await sessionBob.GetAsync($"/api/demandes-produits?clientId={bob.Id}")).StatusCode);
        }

        [Fact]
        public async Task Un_client_ne_peut_pas_fixer_le_prix_d_un_service()
        {
            var client = await _app.CreerUtilisateurAsync();
            var service = await _app.AvecDbAsync(async db =>
            {
                var s = new Service
                {
                    Id = Guid.NewGuid(), NomService = "Site vitrine", Categorie = "Web",
                    Montant = null, Statut = "Actif", CreatedAt = DateTimeOffset.UtcNow
                };
                db.Services.Add(s);
                await db.SaveChangesAsync();
                return s;
            });
            var session = await _app.ConnecterAsync(client.Email);

            var r = await session.PostAsync("/api/demandes-services", new { serviceId = service.Id, montantConvenu = 1 });

            Assert.Equal(HttpStatusCode.Created, r.StatusCode);
            var demande = await ApiSession.JsonAsync(r);
            Assert.Equal(System.Text.Json.JsonValueKind.Null, demande.GetProperty("montantConvenu").ValueKind);
        }

        [Fact]
        public async Task Un_client_ne_peut_pas_modifier_le_catalogue()
        {
            var client = await _app.CreerUtilisateurAsync();
            var session = await _app.ConnecterAsync(client.Email);

            var r = await session.PostAsync("/api/produits", new
            {
                nomProduit = "Pirate", categorie = "Audio", montant = 1, stock = 1, statut = "Disponible"
            });

            Assert.Equal(HttpStatusCode.Forbidden, r.StatusCode);
        }
    }
}
