using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Client")]
    public class User
    {
        [Key]
        [Required]
        [Column("id")]
        public Guid Id{get;set;}

        [Required]
        [Column("nom")]
        public string Nom { get; set; }=string.Empty;

        [Required]
        [Column("prenom")]
        public string Prenom { get; set; }=string.Empty;

        [Required]
        [Column("email",TypeName ="citext")]
        public string Email { get; set; }=string.Empty;

        [Required]
        [Column("password")]
        public string Password { get; set; } =string.Empty;

        // "Client" ou "Admin". Jamais choisi par l'utilisateur lui-même (voir AuthService.SignupAsync
        // qui force toujours "Client") — seul un Admin peut promouvoir un compte via UserService.UpdateRoleAsync.
        [Required]
        [Column("role")]
        public string Role { get; set; } = "Client";

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; }

        public ICollection<DemandeProduit> DemandesProduits { get; set; } = new List<DemandeProduit>();
        public ICollection<DemandeService> DemandesServices { get; set; } = new List<DemandeService>();
        public ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();
    }
}