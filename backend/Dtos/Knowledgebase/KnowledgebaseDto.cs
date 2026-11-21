using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Knowledgebase
{
    public class CreateKnowledgebaseDto
    {
        [Required, StringLength(270, MinimumLength = 2)]
        public string Titre { get; set; } = string.Empty;

        [Required]
        public string Contenu { get; set; } = string.Empty;
    }

    public class UpdateKnowledgebaseDto
    {
        [Required, StringLength(270, MinimumLength = 2)]
        public string Titre { get; set; } = string.Empty;

        [Required]
        public string Contenu { get; set; } = string.Empty;
    }

    public class KnowledgebaseDto
    {
        public Guid Id { get; set; }
        public string Titre { get; set; } = string.Empty;
        public string Contenu { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
    }
}
