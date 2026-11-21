using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Avis
{
    public class CreateAvisDto
    {
        [Required, Range(1, 5, ErrorMessage = "La note doit être comprise entre 1 et 5.")]
        public int Note { get; set; }

        [Required, StringLength(1000, MinimumLength = 3)]
        public string Commentaire { get; set; } = string.Empty;

        // Pas de "ClientId" ni de "Statut" ici : le client est déduit du token
        // et un avis démarre toujours "En attente" de modération.
    }

    public class UpdateAvisStatutDto
    {
        [Required, RegularExpression("^(En attente|Publiée)$")]
        public string Statut { get; set; } = string.Empty;
    }

    public class AvisDto
    {
        public Guid Id { get; set; }
        public Guid ClientId { get; set; }
        public string ClientNom { get; set; } = string.Empty;
        public int Note { get; set; }
        public string Commentaire { get; set; } = string.Empty;
        public string Statut { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
    }
}
