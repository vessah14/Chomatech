using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    // Ligne unique de configuration (infos entreprise) : pas de collection, un seul enregistrement
    // relu/écrit par ParametreService. Pas de section "alertes email/SMS" : aucun système d'envoi
    // n'existe côté backend, on ne stocke pas de préférences pour une fonctionnalité inexistante.
    [Table("Parametres_Site")]
    public class Parametre
    {
        [Key]
        [Required]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("nom_entreprise")]
        public string NomEntreprise { get; set; } = "CHOMA TECH";

        [Required]
        [Column("slogan")]
        public string Slogan { get; set; } = string.Empty;

        [Required]
        [Column("email")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Column("telephone")]
        public string Telephone { get; set; } = string.Empty;

        [Required]
        [Column("adresse")]
        public string Adresse { get; set; } = string.Empty;

        [Required]
        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; }
    }
}
