using backend.Dtos.Produit;

namespace backend.Interfaces
{
    public interface IProduitService
    {
        Task<IEnumerable<ProduitDto>> GetAllAsync();
        Task<ProduitDto?> GetByIdAsync(Guid id);
        Task<ProduitDto> CreateAsync(CreateProduitDto dto);
        Task<ProduitDto?> UpdateAsync(Guid id, UpdateProduitDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
