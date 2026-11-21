using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    // Inscriptions au formulaire newsletter public (page Annonces) : un simple email, pas de
    // compte requis. Aucun envoi n'est fait par le backend — la liste est exportée depuis l'admin.
    [Table("Abonne_Newsletter")]
    public class AbonneNewsletter
    {
        [Key]
        [Required]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("email", TypeName = "citext")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; }
    }
}
