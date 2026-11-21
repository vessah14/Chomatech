using backend.Data;
using backend.Dtos.DemandeProduit;
using backend.Interfaces;
using backend.Models;
using backend.Services.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class DemandeProduitService : IDemandeProduitService
    {
        private readonly AppDbContext _context;

        public DemandeProduitService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<DemandeProduitDto>> GetAllAsync()
        {
            return await _context.DemandesProduits
                .Include(d => d.Client)
                .Include(d => d.Produit)
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => ToDto(d))
                .ToListAsync();
        }

        public async Task<IEnumerable<DemandeProduitDto>> GetByClientIdAsync(Guid clientId)
        {
            return await _context.DemandesProduits
                .Include(d => d.Client)
                .Include(d => d.Produit)
                .Where(d => d.ClientId == clientId)
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => ToDto(d))
                .ToListAsync();
        }

        public async Task<DemandeProduitDto?> GetByIdAsync(Guid id)
        {
            var demande = await _context.DemandesProduits
                .Include(d => d.Client)
                .Include(d => d.Produit)
                .SingleOrDefaultAsync(d => d.Id == id);

            return demande is null ? null : ToDto(demande);
        }

        public async Task<DemandeProduitDto> CreateAsync(CreateDemandeProduitDto dto)
        {
            var client = await _context.Clients.FindAsync(dto.ClientId)
                ?? throw new NotFoundException("Client introuvable.");

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var demande = await AjouterDemandeAsync(client, dto.ProduitId, dto.Quantite);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return ToDto(demande);
        }

        public async Task<IEnumerable<DemandeProduitDto>> CreateLotAsync(Guid clientId, CreateDemandesProduitLotDto dto)
        {
            var client = await _context.Clients.FindAsync(clientId)
                ?? throw new NotFoundException("Client introuvable.");

            // Un même produit présent deux fois dans le panier = une seule ligne, quantités cumulées.
            var lignes = dto.Lignes
                .GroupBy(l => l.ProduitId)
                .Select(g => (ProduitId: g.Key, Quantite: g.Sum(l => l.Quantite)));

            // Tout ou rien : si un seul produit est en rupture, aucune demande n'est créée et
            // aucun stock n'est décrémenté (rollback à la sortie du using sans Commit).
            await using var transaction = await _context.Database.BeginTransactionAsync();

            var demandes = new List<DemandeProduit>();
            foreach (var (produitId, quantite) in lignes)
            {
                demandes.Add(await AjouterDemandeAsync(client, produitId, quantite));
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return demandes.Select(ToDto).ToList();
        }

        public async Task<DemandeProduitDto?> UpdateStatutAsync(Guid id, UpdateDemandeProduitStatutDto dto)
        {
            var demande = await _context.DemandesProduits
                .Include(d => d.Client)
                .Include(d => d.Produit)
                .SingleOrDefaultAsync(d => d.Id == id);

            if (demande is null) return null;

            var etaitAnnulee = demande.Statut == StatutAnnulee;
            var devientAnnulee = dto.Statut == StatutAnnulee;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            // Annuler restitue le stock réservé ; "désannuler" le reprend (et échoue s'il a été
            // revendu entre-temps), pour que le stock reste toujours cohérent avec les demandes.
            if (!etaitAnnulee && devientAnnulee)
            {
                await RestituerStockAsync(demande.ProduitId, demande.Quantite);
            }
            else if (etaitAnnulee && !devientAnnulee)
            {
                await ReserverStockAsync(demande.ProduitId, demande.Quantite, demande.Produit?.NomProduit);
            }

            demande.Statut = dto.Statut;
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return ToDto(demande);
        }

        public async Task<DemandeProduitDto?> UpdatePaiementAsync(Guid id, UpdateDemandeProduitPaiementDto dto)
        {
            var demande = await _context.DemandesProduits
                .Include(d => d.Client)
                .Include(d => d.Produit)
                .SingleOrDefaultAsync(d => d.Id == id);

            if (demande is null) return null;

            demande.EstPaye = dto.EstPaye;
            await _context.SaveChangesAsync();

            return ToDto(demande);
        }

        public async Task<DemandeProduitDto?> UpdateQuantiteClientAsync(Guid id, Guid clientId, UpdateDemandeProduitQuantiteDto dto)
        {
            var demande = await _context.DemandesProduits
                .Include(d => d.Client).Include(d => d.Produit)
                .SingleOrDefaultAsync(d => d.Id == id && d.ClientId == clientId);
            if (demande is null) return null;
            VerifierModifiableParClient(demande);
            if (dto.Quantite == demande.Quantite) return ToDto(demande);

            await using var transaction = await _context.Database.BeginTransactionAsync();
            var difference = dto.Quantite - demande.Quantite;
            if (difference > 0)
                await ReserverStockAsync(demande.ProduitId, difference, demande.Produit?.NomProduit);
            else
                await RestituerStockAsync(demande.ProduitId, -difference);

            demande.Quantite = dto.Quantite;
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return ToDto(demande);
        }

        public async Task<DemandeProduitDto?> AnnulerClientAsync(Guid id, Guid clientId)
        {
            var demande = await _context.DemandesProduits
                .Include(d => d.Client).Include(d => d.Produit)
                .SingleOrDefaultAsync(d => d.Id == id && d.ClientId == clientId);
            if (demande is null) return null;
            VerifierModifiableParClient(demande);

            await using var transaction = await _context.Database.BeginTransactionAsync();
            await RestituerStockAsync(demande.ProduitId, demande.Quantite);
            demande.Statut = StatutAnnulee;
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return ToDto(demande);
        }

        public async Task<bool> DeleteClientAsync(Guid id, Guid clientId)
        {
            var demande = await _context.DemandesProduits
                .SingleOrDefaultAsync(d => d.Id == id && d.ClientId == clientId);
            if (demande is null) return false;
            VerifierModifiableParClient(demande);

            await using var transaction = await _context.Database.BeginTransactionAsync();
            await RestituerStockAsync(demande.ProduitId, demande.Quantite);
            _context.DemandesProduits.Remove(demande);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }

        private static void VerifierModifiableParClient(DemandeProduit demande)
        {
            if (demande.Statut != "Préparation" || demande.EstPaye || demande.PaiementId.HasValue)
                throw new BadRequestException("Cette commande ne peut plus être modifiée : elle est déjà en traitement ou liée à un paiement.");
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var demande = await _context.DemandesProduits.FindAsync(id);
            if (demande is null) return false;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            // Supprimer une demande pas encore livrée ni annulée libère le stock qu'elle réservait
            // (une demande livrée a réellement consommé le stock, une annulée l'a déjà rendu).
            if (demande.Statut != StatutAnnulee && demande.Statut != StatutLivree)
            {
                await RestituerStockAsync(demande.ProduitId, demande.Quantite);
            }

            _context.DemandesProduits.Remove(demande);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return true;
        }

        private const string StatutAnnulee = "Annulée";
        private const string StatutLivree = "Livrée";

        private async Task<DemandeProduit> AjouterDemandeAsync(User client, Guid produitId, int quantite)
        {
            var produit = await _context.Produits.FindAsync(produitId)
                ?? throw new NotFoundException("Produit introuvable.");

            // "Rupture de stock" / "Archivé" : le front masque déjà le bouton, mais un panier
            // gardé en localStorage (ou un appel direct à l'API) pouvait encore le commander.
            if (produit.Statut != "Disponible")
            {
                throw new BadRequestException($"\"{produit.NomProduit}\" n'est plus disponible à la commande.");
            }

            await ReserverStockAsync(produit.Id, quantite, produit.NomProduit);

            var demande = new DemandeProduit
            {
                Id = Guid.NewGuid(),
                ClientId = client.Id,
                ProduitId = produit.Id,
                Quantite = quantite,
                MontantUnitaire = produit.Montant, // prix figé au moment de la demande
                Statut = "Préparation",
                CreatedAt = DateTimeOffset.UtcNow,
                Client = client,
                Produit = produit
            };

            _context.DemandesProduits.Add(demande);
            return demande;
        }

        // Décrément atomique côté base (UPDATE ... WHERE stock >= quantite) : deux commandes
        // simultanées ne peuvent pas toutes deux passer sur le dernier article en stock, ce que
        // permettait l'ancien "lire le stock en C#, puis le réécrire".
        private async Task ReserverStockAsync(Guid produitId, int quantite, string? nomProduit)
        {
            var lignesModifiees = await _context.Produits
                .Where(p => p.Id == produitId && p.Stock >= quantite)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock - quantite));

            if (lignesModifiees == 0)
            {
                var disponible = await _context.Produits
                    .Where(p => p.Id == produitId)
                    .Select(p => (int?)p.Stock)
                    .SingleOrDefaultAsync();

                throw new BadRequestException(
                    $"Stock insuffisant pour \"{nomProduit}\" ({disponible ?? 0} disponible(s)).");
            }
        }

        private Task RestituerStockAsync(Guid produitId, int quantite)
        {
            return _context.Produits
                .Where(p => p.Id == produitId)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock + quantite));
        }

        private static DemandeProduitDto ToDto(DemandeProduit d) => new()
        {
            Id = d.Id,
            ClientId = d.ClientId,
            ClientNom = d.Client is null ? string.Empty : $"{d.Client.Prenom} {d.Client.Nom}",
            ProduitId = d.ProduitId,
            NomProduit = d.Produit?.NomProduit ?? string.Empty,
            Image = d.Produit?.Image,
            Quantite = d.Quantite,
            MontantUnitaire = d.MontantUnitaire,
            Statut = d.Statut,
            EstPaye = d.EstPaye,
            PeutEtreModifiee = d.Statut == "Préparation" && !d.EstPaye && !d.PaiementId.HasValue,
            CreatedAt = d.CreatedAt
        };
    }
}
