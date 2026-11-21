using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Knowledgebase")]
    public class Knowledgebase
    {
        [Key]
        [Required]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("titre")]
        public string Titre { get; set; } = string.Empty;

        [Required]
        [Column("contenu", TypeName = "text")]
        public string Contenu { get; set; } = string.Empty;

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; }
    }
}
