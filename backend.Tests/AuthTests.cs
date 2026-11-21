using System.Net;
using System.Net.Http.Headers;
using System.Text.RegularExpressions;
using backend.Interfaces;

namespace backend.Tests
{
    [Collection(ApiCollection.Nom)]
    public class AuthTests
    {
        private readonly ChomatechFactory _app;

        public AuthTests(ChomatechFactory app)
        {
            _app = app;
        }

        [Fact]
        public async Task Inscription_puis_connexion_pose_un_cookie_HttpOnly_sans_jeton_dans_la_reponse()
        {
            var email = ChomatechFactory.EmailUnique();
            var session = _app.Session();

            var inscription = await session.PostAsync("/api/auth/signup",
                new { nom = "Doe", prenom = "Jane", email, password = ChomatechFactory.MotDePasse });
            Assert.Equal(HttpStatusCode.Created, inscription.StatusCode);

            var connexion = await session.PostAsync("/api/auth/login",
                new { email, password = ChomatechFactory.MotDePasse, rememberMe = true });
            Assert.Equal(HttpStatusCode.OK, connexion.StatusCode);

            var corps = await connexion.Content.ReadAsStringAsync();
            Assert.DoesNotContain("token", corps, StringComparison.OrdinalIgnoreCase);

            var setCookie = session.DernierSetCookie!.ToLowerInvariant();
            Assert.StartsWith("chomatech_client=", setCookie);
            Assert.Contains("httponly", setCookie);
            Assert.Contains("samesite=strict", setCookie);
            Assert.Contains("expires=", setCookie); // "se souvenir de moi" = cookie persistant

            var moi = await session.GetAsync("/api/users/me");
            Assert.Equal(HttpStatusCode.OK, moi.StatusCode);
        }

        [Fact]
        public async Task Sans_se_souvenir_de_moi_le_cookie_est_un_cookie_de_session()
        {
            var user = await _app.CreerUtilisateurAsync();
            var session = await _app.ConnecterAsync(user.Email, rememberMe: false);

            Assert.DoesNotContain("expires=", session.DernierSetCookie!.ToLowerInvariant());
        }

        [Fact]
        public async Task Une_ecriture_sans_en_tete_X_Chomatech_App_est_refusee_CSRF()
        {
            var session = _app.Session();
            var reponse = await session.EnvoyerAsync(HttpMethod.Post, "/api/auth/login",
                new { email = "x@example.com", password = "x" }, sansEnTeteApp: true);

            Assert.Equal(HttpStatusCode.Forbidden, reponse.StatusCode);
        }

        [Fact]
        public async Task Cinq_mots_de_passe_faux_bloquent_le_compte()
        {
            var user = await _app.CreerUtilisateurAsync();
            var session = _app.Session();
            var codes = new List<HttpStatusCode>();

            for (var i = 0; i < 6; i++)
            {
                var r = await session.PostAsync("/api/auth/login", new { email = user.Email, password = "mauvais-mot-de-passe" });
                codes.Add(r.StatusCode);
            }

            Assert.All(codes.Take(5), c => Assert.Equal(HttpStatusCode.Unauthorized, c));
            Assert.Equal(HttpStatusCode.TooManyRequests, codes[5]);

            // Même le BON mot de passe est refusé pendant le blocage.
            var bon = await session.PostAsync("/api/auth/login", new { email = user.Email, password = ChomatechFactory.MotDePasse });
            Assert.Equal(HttpStatusCode.TooManyRequests, bon.StatusCode);
        }

        [Fact]
        public async Task Le_blocage_s_applique_aussi_aux_emails_inexistants_anti_enumeration()
        {
            // Sinon un attaquant distinguerait "compte existant" (bloqué au 6e essai) de
            // "compte inexistant" (jamais bloqué).
            var inconnu = ChomatechFactory.EmailUnique("inconnu");
            var session = _app.Session();
            for (var i = 0; i < 5; i++)
            {
                await session.PostAsync("/api/auth/login", new { email = inconnu, password = "x-x-x-x-x" });
            }

            var sixieme = await session.PostAsync("/api/auth/login", new { email = inconnu, password = "x-x-x-x-x" });
            Assert.Equal(HttpStatusCode.TooManyRequests, sixieme.StatusCode);
        }

        [Fact]
        public async Task Changer_son_mot_de_passe_revoque_l_ancienne_session()
        {
            var user = await _app.CreerUtilisateurAsync();
            var session = await _app.ConnecterAsync(user.Email);
            var cookieVole = session.Cookie;

            var changement = await session.PatchAsync("/api/users/me/password",
                new { motDePasseActuel = ChomatechFactory.MotDePasse, nouveauMotDePasse = "Nouveau-Mdp-456" });
            Assert.Equal(HttpStatusCode.NoContent, changement.StatusCode);

            // L'appareil qui a changé le mot de passe reste connecté (nouveau cookie)...
            Assert.Equal(HttpStatusCode.OK, (await session.GetAsync("/api/users/me")).StatusCode);

            // ... mais l'ancien jeton (ex. volé) est refusé.
            var voleur = _app.Session();
            voleur.Cookie = cookieVole;
            Assert.Equal(HttpStatusCode.Unauthorized, (await voleur.GetAsync("/api/users/me")).StatusCode);
        }

        [Fact]
        public async Task Mauvais_mot_de_passe_actuel_renvoie_400_et_ne_deconnecte_pas()
        {
            var user = await _app.CreerUtilisateurAsync();
            var session = await _app.ConnecterAsync(user.Email);

            var r = await session.PatchAsync("/api/users/me/password",
                new { motDePasseActuel = "faux-faux-faux", nouveauMotDePasse = "Nouveau-Mdp-456" });

            Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await session.GetAsync("/api/users/me")).StatusCode);
        }

        [Fact]
        public async Task Mot_de_passe_oublie_envoie_un_lien_utilisable_une_seule_fois()
        {
            var user = await _app.CreerUtilisateurAsync();
            var session = _app.Session();

            var demande = await session.PostAsync("/api/auth/demander-reset-password", new { email = user.Email });
            Assert.Equal(HttpStatusCode.OK, demande.StatusCode);

            var email = _app.Emails.DernierPour(user.Email);
            Assert.NotNull(email);
            var token = Uri.UnescapeDataString(Regex.Match(email!.Texte, @"token=([^\s]+)").Groups[1].Value);
            Assert.False(string.IsNullOrEmpty(token));

            var reset = await session.PostAsync("/api/auth/reset-password",
                new { token, newPassword = "Nouveau-Mdp-456", confirmPassword = "Nouveau-Mdp-456" });
            Assert.Equal(HttpStatusCode.OK, reset.StatusCode);

            var reutilisation = await session.PostAsync("/api/auth/reset-password",
                new { token, newPassword = "Encore-Autre-789", confirmPassword = "Encore-Autre-789" });
            Assert.Equal(HttpStatusCode.BadRequest, reutilisation.StatusCode);

            var ancien = await session.PostAsync("/api/auth/login", new { email = user.Email, password = ChomatechFactory.MotDePasse });
            Assert.Equal(HttpStatusCode.Unauthorized, ancien.StatusCode);

            var nouveau = await session.PostAsync("/api/auth/login", new { email = user.Email, password = "Nouveau-Mdp-456" });
            Assert.Equal(HttpStatusCode.OK, nouveau.StatusCode);
        }

        [Fact]
        public async Task Mot_de_passe_oublie_meme_reponse_pour_un_email_inconnu_et_aucun_email_envoye()
        {
            var inconnu = ChomatechFactory.EmailUnique("personne");
            var r = await _app.Session().PostAsync("/api/auth/demander-reset-password", new { email = inconnu });

            Assert.Equal(HttpStatusCode.OK, r.StatusCode);
            Assert.Null(_app.Emails.DernierPour(inconnu));
        }

        [Fact]
        public async Task Un_jeton_de_reinitialisation_n_ouvre_pas_de_session()
        {
            var user = await _app.CreerUtilisateurAsync();
            await _app.Session().PostAsync("/api/auth/demander-reset-password", new { email = user.Email });
            var token = Uri.UnescapeDataString(Regex.Match(_app.Emails.DernierPour(user.Email)!.Texte, @"token=([^\s]+)").Groups[1].Value);

            var client = _app.CreateClient();
            var requete = new HttpRequestMessage(HttpMethod.Get, "/api/users/me");
            requete.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            Assert.Equal(HttpStatusCode.Unauthorized, (await client.SendAsync(requete)).StatusCode);
        }

        [Fact]
        public async Task Le_panneau_admin_refuse_un_compte_client()
        {
            var client = await _app.CreerUtilisateurAsync("Client");
            var r = await _app.Session("admin").PostAsync("/api/auth/login", new { email = client.Email, password = ChomatechFactory.MotDePasse });

            Assert.Equal(HttpStatusCode.Forbidden, r.StatusCode);
        }

        [Fact]
        public async Task Un_admin_n_obtient_jamais_de_session_longue_duree()
        {
            var admin = await _app.CreerUtilisateurAsync("Admin");
            var session = await _app.ConnecterAsync(admin.Email, rememberMe: true);

            Assert.DoesNotContain("expires=", session.DernierSetCookie!.ToLowerInvariant());
        }

        [Fact]
        public async Task Connexion_Google_refusee_pour_un_compte_admin()
        {
            var admin = await _app.CreerUtilisateurAsync("Admin");
            _app.AuthExterne.Profil = new ProfilExterne(admin.Email, "Faux", "Admin");

            var r = await _app.Session().PostAsync("/api/auth/google", new { accessToken = "jeton-google" });

            Assert.Equal(HttpStatusCode.Unauthorized, r.StatusCode);
        }

        [Fact]
        public async Task Connexion_Google_cree_un_compte_client_pour_un_nouvel_email()
        {
            var email = ChomatechFactory.EmailUnique("google");
            _app.AuthExterne.Profil = new ProfilExterne(email, "Awa", "Ndiaye");
            var session = _app.Session();

            var r = await session.PostAsync("/api/auth/google", new { accessToken = "jeton-google" });
            Assert.Equal(HttpStatusCode.OK, r.StatusCode);

            var moi = await ApiSession.JsonAsync(await session.GetAsync("/api/users/me"));
            Assert.Equal(email, moi.GetProperty("email").GetString());
            Assert.Equal("Client", moi.GetProperty("role").GetString());
        }

        [Fact]
        public async Task Retrograder_un_admin_coupe_sa_session_immediatement()
        {
            var adminA = await _app.CreerUtilisateurAsync("Admin");
            var adminB = await _app.CreerUtilisateurAsync("Admin");
            var sessionA = await _app.ConnecterAsync(adminA.Email, "admin");
            var sessionB = await _app.ConnecterAsync(adminB.Email, "admin");

            Assert.Equal(HttpStatusCode.OK, (await sessionA.GetAsync("/api/users")).StatusCode);

            var retrogradation = await sessionB.PatchAsync($"/api/users/{adminA.Id}/role", new { role = "Client" });
            Assert.Equal(HttpStatusCode.OK, retrogradation.StatusCode);

            Assert.Equal(HttpStatusCode.Unauthorized, (await sessionA.GetAsync("/api/users")).StatusCode);
        }

        [Fact]
        public async Task Un_admin_ne_peut_pas_supprimer_son_propre_compte()
        {
            var admin = await _app.CreerUtilisateurAsync("Admin");
            var session = await _app.ConnecterAsync(admin.Email, "admin");

            var r = await session.DeleteAsync($"/api/users/{admin.Id}");

            Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        }

        [Fact]
        public async Task Deconnexion_efface_le_cookie()
        {
            var user = await _app.CreerUtilisateurAsync();
            var session = await _app.ConnecterAsync(user.Email);

            var r = await session.PostAsync("/api/auth/logout");

            Assert.Equal(HttpStatusCode.NoContent, r.StatusCode);
            Assert.Null(session.Cookie);
            Assert.Equal(HttpStatusCode.Unauthorized, (await session.GetAsync("/api/users/me")).StatusCode);
        }
    }
}
