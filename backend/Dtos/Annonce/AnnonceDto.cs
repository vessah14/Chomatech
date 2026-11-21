using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Annonce
{
    public class CreateAnnonceDto
    {
        [Required, StringLength(250, MinimumLength = 2)]
        public string Titre { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Categorie { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Statut { get; set; } = string.Empty;

        public bool Epingle { get; set; }

        // Pas de "Vues" ici : c'est un compteur géré côté serveur, jamais fourni par le client.
    }

    public class UpdateAnnonceDto
    {
        [Required, StringLength(250, MinimumLength = 2)]
        public string Titre { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Categorie { get; set; } = string.Empty;

        [Required, StringLength(250)]
        public string Statut { get; set; } = string.Empty;

        public bool Epingle { get; set; }
    }

    public class AnnonceDto
    {
        public Guid Id { get; set; }
        public string Titre { get; set; } = string.Empty;
        public string Categorie { get; set; } = string.Empty;
        public string Statut { get; set; } = string.Empty;
        public bool Epingle { get; set; }
        public int Vues { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
