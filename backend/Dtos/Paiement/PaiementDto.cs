using System.ComponentModel.DataAnnotations;
using backend.Dtos.DemandeProduit;

namespace backend.Dtos.Paiement
{
    public class DemarrerPaiementPanierDto
    {
        [Required]
        public Guid RequestKey { get; set; }

        [Required]
        public CreateDemandesProduitLotDto Commande { get; set; } = new();
    }

    public sealed record PaiementCheckoutDto(Guid PaiementId, string CheckoutUrl, string Statut);

    public sealed record PaiementStatutDto(Guid PaiementId, string Statut, bool EstPaye);
}
