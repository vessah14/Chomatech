using System.Net;
using System.Net.Http.Json;

namespace backend.Tests
{
    [Collection(ApiCollection.Nom)]
    public class PaiementTests
    {
        private readonly ChomatechFactory _app;

        public PaiementTests(ChomatechFactory app)
        {
            _app = app;
        }

        [Fact]
        public async Task Un_client_peut_demarrer_un_paiement_panier_avec_un_checkout_SasPay()
        {
            var client = await _app.CreerUtilisateurAsync();
            var session = await _app.ConnecterAsync(client.Email);
            var produit = await _app.CreerProduitAsync(stock: 10, montant: 1500m);

            var reponse = await session.PostAsync("/api/paiements/panier", new
            {
                requestKey = Guid.NewGuid(),
                commande = new
                {
                    lignes = new[]
                    {
                        new { produitId = produit.Id, quantite = 2 }
                    }
                }
            });

            Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);

            var payload = await reponse.Content.ReadFromJsonAsync<Dictionary<string, object>>();
            Assert.NotNull(payload);
            Assert.True(payload!.ContainsKey("paiementId"));
            Assert.True(payload.ContainsKey("checkoutUrl"));
            Assert.Equal("PENDING", payload["statut"]?.ToString());
        }
    }
}
