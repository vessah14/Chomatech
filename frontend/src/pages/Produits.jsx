import Badge from '../Components/ui/Badge'
import { useEffect, useState } from 'react'
import CardsProduct from '../Components/ui/CardProduct'
import { motion } from 'framer-motion'
import { RotateCcw, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { getProduits } from '../api/produits'

export default function Produits () {
  return (
    <>
      <HeroSection />
      <Boutique />
    </>
  )
}

function HeroSection () {
  const { t } = useLanguage()

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className='business-page-hero px-4 py-10 sm:px-6 md:py-14'
    >
      <div className='mx-auto max-w-[1500px]'>
        <Badge
          children={t.shop}
          className='bg-sky-200 px-3 py-1 mb-5 text-sky-500 font-bold'
        />
        <h1 className='max-w-[800px] text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl text-slate-950'>
          {t.productsTitleBefore}{' '}
          <span className='text-sky-400'>{t.productsTitleHighlight}</span>
        </h1>
        <p className='mt-5 max-w-[700px] text-base text-slate-600 sm:text-lg'>
          {t.productsDescription}
        </p>
      </div>
    </motion.section>
  )
}

// Correspond exactement aux catÃ©gories saisies cÃ´tÃ© admin (Administration/Produits.jsx).
const PRIX_MAX_DEFAUT = 3_000_000
const CATEGORIES_BOUTIQUE = [
  { id: 'Ordinateur', label: 'computer' },
  { id: 'T\u00e9l\u00e9phone', label: 'phone' },
  { id: 'Audio', label: 'audio' },
  { id: 'Tablette', label: 'tablet' },
  { id: 'Accessoire', label: 'accessories' }
]

function FilterSidebar ({ onFilterChange, className = '', filters, resultCount, categories }) {
  const { t } = useLanguage()
  const { category: activeCategory, maxPrice, sortBy } = filters

  function handleCategoryClick (cat) {
    onFilterChange?.({ category: cat, maxPrice, sortBy })
  }

  function handlePriceChange (e) {
    const value = Number(e.target.value)
    onFilterChange?.({ category: activeCategory, maxPrice: value, sortBy })
  }

  function handleSortChange (e) {
    onFilterChange?.({
      category: activeCategory,
      maxPrice,
      sortBy: e.target.value
    })
  }

  return (
    <aside
      className={`w-full max-w-[280px] rounded-2xl border border-sky-100 bg-white p-6 shadow-sm ${className}`}
    >
      <div className='mb-5 flex items-center justify-between gap-3'>
        <h3 className='text-lg font-bold text-gray-900'>{t.filters}</h3>
        <span className='rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700'>{resultCount}</span>
      </div>

      {/* CatÃ©gorie */}
      <div className='mb-8'>
        <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3'>
          {t.category}
        </p>
        <div className='flex flex-col gap-1'>
          {categories.map(({ id, label }) => {
            const isActive = (id === 'all' && activeCategory === 'Tout') || id === activeCategory
            return (
              <button
                key={id}
                type='button'
                aria-pressed={isActive}
                onClick={() => handleCategoryClick(id === 'all' ? 'Tout' : id)}
                className={`rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition ${
                  isActive
                    ? 'bg-sky-500 text-white font-semibold shadow-sm'
                    : 'text-gray-600 hover:bg-sky-50'
                }`}
              >
              {t[label] || label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Prix maximum */}
      <div className='mb-8'>
        <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3'>
          {t.maxPrice}
        </p>
        <input
          type='range'
          min={0}
          max={PRIX_MAX_DEFAUT}
          step={50000}
          value={maxPrice}
          onChange={handlePriceChange}
          className='w-full accent-sky-500 cursor-pointer'
        />
        <p className='mt-2 text-sm font-semibold text-sky-700'>
          {maxPrice.toLocaleString('fr-FR')} FCFA
        </p>
      </div>

      {/* Trier par */}
      <div>
        <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3'>
          {t.sortByPrice}
        </p>
        <select
          value={sortBy}
          onChange={handleSortChange}
          className='w-full rounded-xl border border-sky-200 px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-300'
        >
          <option value='default'>{t.default}</option>
          <option value='asc'>{t.ascending}</option>
          <option value='desc'>{t.descending}</option>
        </select>
      </div>
    </aside>
  )
}

function Boutique () {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const [produits, setProduits] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filters, setFilters] = useState({
    category: searchParams.get('categorie') || 'Tout',
    maxPrice: PRIX_MAX_DEFAUT,
    sortBy: 'default'
  })

  useEffect(() => {
    let annule = false
    getProduits()
      .then(data => {
        // "ArchivÃ©" = retirÃ© du catalogue par l'admin : ne doit plus apparaÃ®tre dans la boutique.
        if (!annule) setProduits(data.filter(p => p.statut !== 'ArchivÃ©'))
      })
      .catch(err => {
        if (!annule) setErreur(err.message)
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  const categories = [...new Set([
    ...CATEGORIES_BOUTIQUE.map(({ id }) => id),
    ...produits.map(produit => produit.categorie).filter(Boolean)
  ])].map(id => ({
    id,
    label: CATEGORIES_BOUTIQUE.find(categorie => categorie.id === id)?.label || id
  }))

  let produitsFiltres = produits
    .filter(p => filters.category === 'Tout' || p.categorie === filters.category)
    .filter(p => {
      const terme = normaliserTexte(recherche)
      if (!terme) return true
      return [p.nomProduit, p.description, p.categorie]
        .some(valeur => normaliserTexte(valeur).includes(terme))
    })
    // Curseur au maximum = "pas de limite" : sinon tout produit au-delÃ  de 3 000 000 FCFA
    // Ã©tait invisible dans la boutique, mÃªme sans aucun filtre choisi.
    .filter(p => filters.maxPrice >= PRIX_MAX_DEFAUT || p.montant <= filters.maxPrice)

  if (filters.sortBy === 'asc') {
    produitsFiltres = [...produitsFiltres].sort((a, b) => a.montant - b.montant)
  } else if (filters.sortBy === 'desc') {
    produitsFiltres = [...produitsFiltres].sort((a, b) => b.montant - a.montant)
  }

  return (
    <div className='max-w-7xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-8 items-start'>
      <FilterSidebar
        onFilterChange={setFilters}
        filters={filters}
        categories={[{ id: 'all', label: 'all' }, ...categories]}
        resultCount={chargement ? 'â€¦' : produitsFiltres.length}
        className='lg:sticky lg:top-24'
      />

      <div className='flex-1'>
        <div className='relative mb-5 max-w-2xl'>
          <Search aria-hidden='true' className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
          <label htmlFor='recherche-produits' className='sr-only'>{t.searchProducts}</label>
          <input
            id='recherche-produits'
            type='search'
            value={recherche}
            onChange={event => setRecherche(event.target.value)}
            placeholder={t.searchProducts}
            className='w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
          />
        </div>
        {erreur && <p role='alert' className='mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>{erreur}</p>}

        {chargement ? (
          <div role='status' className='rounded-2xl border border-slate-200 bg-white py-20 text-center text-slate-500'>{t.loading}</div>
        ) : produitsFiltres.length > 0 ? (
          <div className='product-catalog-grid grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4'>
            {produitsFiltres.map(produit => (
              <CardsProduct
                key={produit.id}
                type={produit.categorie}
                statut={produit.statut}
                tittle={produit.nomProduit}
                price={produit.montant}
                image={produit.image}
                id={produit.id}
                stock={produit.stock}
              />
            ))}
          </div>
        ) : (
          <div className='rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center'>
            <p className='text-lg font-semibold text-slate-800'>{t.noProducts}</p>
            <p className='mt-2 text-sm text-slate-500'>{t.adjustFilters}</p>
            <button type='button' onClick={() => setFilters({ category: 'Tout', maxPrice: PRIX_MAX_DEFAUT, sortBy: 'default' })} className='mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700'>
              <RotateCcw size={16} /> {t.resetFilters}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function normaliserTexte (valeur) {
  return String(valeur ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
}




