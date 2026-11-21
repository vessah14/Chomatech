using backend.Data;
using backend.Dtos.Produit;
using backend.Interfaces;
using backend.Models;
using backend.Services.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class ProduitService : IProduitService
    {
        private readonly AppDbContext _context;

        public ProduitService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ProduitDto>> GetAllAsync()
        {
            return await _context.Produits
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => ToDto(p))
                .ToListAsync();
        }

        public async Task<ProduitDto?> GetByIdAsync(Guid id)
        {
            var produit = await _context.Produits.FindAsync(id);
            return produit is null ? null : ToDto(produit);
        }

        public async Task<ProduitDto> CreateAsync(CreateProduitDto dto)
        {
            var produit = new Produit
            {
                Id = Guid.NewGuid(),
                NomProduit = dto.NomProduit,
                Categorie = dto.Categorie,
                Montant = dto.Montant,
                Stock = dto.Stock,
                Image = dto.Image,
                Description = dto.Description,
                Statut = dto.Statut,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.Produits.Add(produit);
            await _context.SaveChangesAsync();

            return ToDto(produit);
        }

        public async Task<ProduitDto?> UpdateAsync(Guid id, UpdateProduitDto dto)
        {
            var produit = await _context.Produits.FindAsync(id);
            if (produit is null) return null;

            produit.NomProduit = dto.NomProduit;
            produit.Categorie = dto.Categorie;
            produit.Montant = dto.Montant;
            produit.Stock = dto.Stock;
            produit.Image = dto.Image;
            produit.Description = dto.Description;
            produit.Statut = dto.Statut;

            await _context.SaveChangesAsync();

            return ToDto(produit);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var produit = await _context.Produits.FindAsync(id);
            if (produit is null) return false;

            _context.Produits.Remove(produit);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                throw new ConflictException("Ce produit a encore des demandes associées et ne peut pas être supprimé.");
            }

            return true;
        }

        private static ProduitDto ToDto(Produit p) => new()
        {
            Id = p.Id,
            NomProduit = p.NomProduit,
            Categorie = p.Categorie,
            Montant = p.Montant,
            Stock = p.Stock,
            Image = p.Image,
            Description = p.Description,
            Statut = p.Statut,
            CreatedAt = p.CreatedAt
        };
    }
}
