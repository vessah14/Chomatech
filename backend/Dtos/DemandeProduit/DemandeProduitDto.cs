using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.DemandeProduit
{
    public class CreateDemandeProduitDto
    {
        [Required]
        public Guid ClientId { get; set; }

        [Required]
        public Guid ProduitId { get; set; }

        [Required, Range(1, 1000)]
        public int Quantite { get; set; } = 1;

        // Pas de MontantUnitaire ici volontairement : le prix doit être copié depuis
        // Produit.Montant côté serveur au moment de la création, jamais reçu du client
        // (sinon n'importe qui pourrait commander au prix de son choix).
    }

    // Commande du panier en une seule requête : toutes les lignes sont créées dans une même
    // transaction (tout ou rien), pour qu'un échec sur un produit ne laisse pas une commande
    // partielle que le client recréerait en double en réessayant.
    public class CreateDemandesProduitLotDto
    {
        [Required, MinLength(1), MaxLength(50)]
        public List<LigneCommandeDto> Lignes { get; set; } = new();
    }

    public class LigneCommandeDto
    {
        [Required]
        public Guid ProduitId { get; set; }

        [Required, Range(1, 1000)]
        public int Quantite { get; set; } = 1;
    }

    public class UpdateDemandeProduitStatutDto
    {
        [Required, RegularExpression("^(Préparation|En cours|Livrée|Annulée)$",
            ErrorMessage = "Statut invalide (Préparation, En cours, Livrée ou Annulée).")]
        public string Statut { get; set; } = string.Empty;
    }

    public class UpdateDemandeProduitPaiementDto
    {
        [Required]
        public bool EstPaye { get; set; }
    }

    public class UpdateDemandeProduitQuantiteDto
    {
        [Required, Range(1, 1000)]
        public int Quantite { get; set; }
    }

    public class DemandeProduitDto
    {
        public Guid Id { get; set; }
        public Guid ClientId { get; set; }
        public string ClientNom { get; set; } = string.Empty;
        public Guid ProduitId { get; set; }
        public string NomProduit { get; set; } = string.Empty;
        public string? Image { get; set; }
        public int Quantite { get; set; }
        public decimal MontantUnitaire { get; set; }
        public string Statut { get; set; } = string.Empty;
        public bool EstPaye { get; set; }
        public bool PeutEtreModifiee { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
