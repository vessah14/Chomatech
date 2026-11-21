using System.Net;
using backend.Interfaces;

namespace backend.Services
{
    // Contenu des emails envoyés par l'application. Toute donnée saisie par un utilisateur est
    // encodée (WebUtility.HtmlEncode) avant d'entrer dans le HTML : sinon un message de contact
    // piégé pourrait injecter du HTML/des liens dans l'email reçu par l'admin.
    public static class EmailTemplates
    {
        public static EmailMessage ReinitialisationMotDePasse(string email, string prenom, string lien) => new(
            email,
            prenom,
            "Réinitialisation de votre mot de passe CHOMA TECH",
            Gabarit(
                $"Bonjour {E(prenom)},",
                "<p>Vous avez demandé à réinitialiser le mot de passe de votre compte CHOMA TECH.</p>" +
                $"<p style=\"text-align:center;margin:28px 0\"><a href=\"{E(lien)}\" style=\"background:#0ea4e8;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold\">Choisir un nouveau mot de passe</a></p>" +
                "<p>Ce lien est valable <strong>30 minutes</strong> et ne peut servir qu'une fois.</p>" +
                "<p style=\"color:#64748b\">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe actuel reste inchangé.</p>"),
            $"Bonjour {prenom},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 30 minutes, une seule fois) :\n{lien}\n\n" +
            "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.");

        public static EmailMessage NouveauMessageContact(string emailEntreprise, string nomComplet, string emailVisiteur,
            string? telephone, string? entreprise, string? service, string? budget, string message)
        {
            string Ligne(string libelle, string? valeur) =>
                string.IsNullOrWhiteSpace(valeur) ? "" : $"<tr><td style=\"color:#64748b;padding:4px 12px 4px 0\">{libelle}</td><td>{E(valeur)}</td></tr>";

            return new EmailMessage(
                emailEntreprise,
                "CHOMA TECH",
                $"Nouveau message de contact : {nomComplet}",
                Gabarit(
                    "Nouveau message depuis le site",
                    "<table style=\"font-size:14px;margin-bottom:16px\">" +
                    Ligne("Nom", nomComplet) + Ligne("Email", emailVisiteur) + Ligne("Téléphone", telephone) +
                    Ligne("Entreprise", entreprise) + Ligne("Service", service) + Ligne("Budget", budget) +
                    "</table>" +
                    $"<div style=\"white-space:pre-line;background:#f1f5f9;padding:16px;border-radius:10px\">{E(message)}</div>" +
                    "<p style=\"color:#64748b\">Répondez directement à cet email pour écrire au visiteur. Le message est aussi visible dans l'administration (Messages de contact).</p>"),
                $"Nouveau message de {nomComplet} <{emailVisiteur}>\n" +
                $"Téléphone : {telephone}\nEntreprise : {entreprise}\nService : {service}\nBudget : {budget}\n\n{message}",
                RepondreA: emailVisiteur);
        }

        public static EmailMessage NouvelleAnnonce(string email, string titre, string categorie, string lien) => new(
            email,
            "",
            $"CHOMA TECH | Nouvelle annonce : {titre}",
            Gabarit("Une nouveauté à découvrir", "<p>Bonjour,</p>" +
                "<p>Les actualités de CHOMA TECH sont à découvrir sur notre site.</p>" +
                $"<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:24px 0;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px\"><tr><td style=\"padding:20px\"><span style=\"display:inline-block;background:#dbeafe;color:#075985;padding:5px 10px;border-radius:20px;font-size:12px;font-weight:bold\">{E(categorie)}</span><h2 style=\"margin:14px 0 0;font-size:21px;line-height:1.35;color:#0f172a\">{E(titre)}</h2></td></tr></table>" +
                $"<p style=\"text-align:center;margin:28px 0\"><a href=\"{E(lien)}\" style=\"display:inline-block;background:#0284c7;color:#ffffff;padding:14px 26px;border-radius:9px;text-decoration:none;font-weight:bold\">Découvrir l’annonce</a></p>" +
                "<p style=\"color:#64748b;font-size:13px\">Vous recevez cette actualité car vous êtes inscrit à la newsletter CHOMA TECH. Pour gérer votre inscription, écrivez-nous à <a href=\"mailto:contact@chomatech.cm\" style=\"color:#0284c7\">contact@chomatech.cm</a>.</p>"),
            $"Bonjour,\n\nLes actualités de CHOMA TECH sont à découvrir sur notre site.\n\n{titre}\nCatégorie : {categorie}\n\nDécouvrir l’annonce : {lien}\n\nVous recevez cette actualité car vous êtes inscrit à la newsletter CHOMA TECH. Pour gérer votre inscription, écrivez-nous à contact@chomatech.cm.");

        public static EmailMessage CampagneNewsletter(string email, string sujet, string contenu)
        {
            var paragraphs = string.Join("", contenu.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Select(p => $"<p>{E(p.Trim())}</p>"));
            return new EmailMessage(email, "", sujet,
                Gabarit(E(sujet), paragraphs + "<p style=\"color:#64748b\">Vous recevez cet email car vous êtes inscrit à la newsletter CHOMA TECH.</p>"),
                $"{contenu}\n\nVous recevez cet email car vous êtes inscrit à la newsletter CHOMA TECH.");
        }

        private static string E(string valeur) => WebUtility.HtmlEncode(valeur);

        private static string Gabarit(string titre, string contenu) =>
            "<!doctype html><html lang=\"fr\"><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head>" +
            "<body style=\"margin:0;padding:0;background:#eef6fb;font-family:Arial,Helvetica,sans-serif;color:#102a43\">" +
            "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#eef6fb\"><tr><td align=\"center\" style=\"padding:28px 12px\">" +
            "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden\">" +
            "<tr><td bgcolor=\"#073b66\" style=\"padding:24px 30px;background:#073b66;border-bottom:4px solid #0ea5e9\"><div style=\"font-size:22px;line-height:1.2;font-weight:800;letter-spacing:1px;color:#ffffff\">CHOMA <span style=\"color:#38bdf8\">TECH</span></div><div style=\"margin-top:7px;font-size:12px;letter-spacing:.4px;color:#dbeafe\">Innover aujourd’hui, impacter demain.</div></td></tr>" +
            "<tr><td style=\"padding:30px 30px 24px\"><h1 style=\"margin:0 0 18px;font-size:23px;line-height:1.3;color:#0f2942\">" + titre + "</h1>" +
            $"<div style=\"font-size:15px;line-height:1.75;color:#334e68\">{contenu}</div></td></tr>" +
            "<tr><td style=\"padding:18px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;line-height:1.6;color:#64748b\">CHOMA TECH · Innover aujourd’hui, impacter demain.<br><a href=\"mailto:contact@chomatech.cm\" style=\"color:#0284c7;text-decoration:none\">contact@chomatech.cm</a></td></tr>" +
            "</table><div style=\"padding:14px 8px 0;font-size:11px;color:#94a3b8\">Vous recevez cet email de CHOMA TECH.</div>" +
            "</td></tr></table></body></html>";
    }
}
