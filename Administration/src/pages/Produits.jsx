import {
  Search,
  Filter,
  X,
  Pencil,
  Trash2,
  Plus,
  Package,
  ClipboardList,
  Upload,
  Loader2
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  getProduits,
  createProduit,
  updateProduit,
  deleteProduit,
  uploadProduitImage
} from '../api/produits'
import { resolveMediaUrl } from '../api/client'
import {
  getDemandesProduits,
  updateDemandeProduitStatut,
  deleteDemandeProduit
} from '../api/demandesProduits'

/* ───────────────── Catalogue produits ───────────────── */

function formatMontant (montant) {
  const nombre = Number(montant)
  return Number.isFinite(nombre) ? `${nombre.toLocaleString('fr-FR')} FCFA` : '—'
}

const categories = ['Ordinateur', 'Téléphone', 'Audio', 'Tablette', 'Accessoire']
const statutsCatalogue = ['Disponible', 'Rupture de stock', 'Archivé']

const statutCatalogueStyle = {
  Disponible: 'text-green-700 bg-green-100',
  'Rupture de stock': 'text-red-700 bg-red-100',
  Archivé: 'text-slate-700 bg-slate-100'
}

const champsVideCatalogue = {
  nom: '',
  categorie: categories[0],
  prix: '',
  stock: '',
  statut: 'Disponible',
  image: '',
  description: ''
}

/* ───────────────── Produits demandés (commandes clients) ───────────────── */

const statutsDemandes = ['Tous', 'Livrée', 'Préparation', 'En cours', 'Annulée']

const statutDemandeStyle = {
  Livrée: 'text-green-700 bg-green-100',
  Préparation: 'text-amber-700 bg-amber-100',
  'En cours': 'text-sky-700 bg-blue-100',
  Annulée: 'text-red-700 bg-red-100'
}

export default function Produits () {
  const [ongletActif, setOngletActif] = useState('catalogue') // 'catalogue' | 'demandes'

  return (
    <section className='max-w-full'>
      {/* Header + onglets */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200'>
        <div>
          <h1 className='text-lg md:text-3xl font-bold text-slate-800'>
            Produits
          </h1>
          <span className='text-sm text-slate-500'>
            Catalogue et demandes des clients
          </span>
        </div>

        <div className='flex items-center gap-2 bg-slate-100 rounded-lg p-1 w-fit'>
          <button
            onClick={() => setOngletActif('catalogue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              ongletActif === 'catalogue'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className='w-4 h-4' />
            Catalogue
          </button>
          <button
            onClick={() => setOngletActif('demandes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              ongletActif === 'demandes'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList className='w-4 h-4' />
            Produits demandés
          </button>
        </div>
      </div>

      {ongletActif === 'catalogue' ? <Catalogue /> : <ProduitsDemandes />}
    </section>
  )
}

/* ───────────────── Section : Catalogue ───────────────── */

function Catalogue () {
  const [produits, setProduits] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState('')
  const [recherche, setRecherche] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [modeModal, setModeModal] = useState('ajouter')
  const [formData, setFormData] = useState(champsVideCatalogue)
  const [produitAModifier, setProduitAModifier] = useState(null)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreurModal, setErreurModal] = useState('')
  const [televersement, setTeleversement] = useState(false)

  useEffect(() => {
    let annule = false
    getProduits()
      .then(data => {
        if (!annule) setProduits(data)
      })
      .catch(err => {
        if (!annule) setErreurChargement(err.message)
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  const ouvrirAjout = () => {
    setModeModal('ajouter')
    setFormData(champsVideCatalogue)
    setErreurModal('')
    setShowModal(true)
  }

  const ouvrirModification = produit => {
    setModeModal('modifier')
    setProduitAModifier(produit)
    setFormData({
      nom: produit.nomProduit,
      categorie: produit.categorie,
      prix: produit.montant,
      stock: produit.stock,
      statut: produit.statut,
      image: produit.image || '',
      description: produit.description || ''
    })
    setErreurModal('')
    setShowModal(true)
  }

  const handleImageChange = async event => {
    const fichier = event.target.files?.[0]
    event.target.value = '' // permet de resélectionner le même fichier après une erreur
    if (!fichier) return

    setTeleversement(true)
    setErreurModal('')
    try {
      const { url } = await uploadProduitImage(fichier)
      setFormData(current => ({ ...current, image: url }))
    } catch (err) {
      setErreurModal(err.message)
    } finally {
      setTeleversement(false)
    }
  }

  const sauvegarder = async () => {
    if (!formData.nom || !formData.prix) return

    const payload = {
      nomProduit: formData.nom,
      categorie: formData.categorie,
      montant: Number(formData.prix),
      stock: Number(formData.stock) || 0,
      statut: formData.statut,
      image: formData.image || null,
      description: formData.description || null
    }

    setEnregistrement(true)
    setErreurModal('')
    try {
      if (modeModal === 'ajouter') {
        const nouveau = await createProduit(payload)
        setProduits(current => [nouveau, ...current])
      } else {
        const misAJour = await updateProduit(produitAModifier.id, payload)
        setProduits(current =>
          current.map(p => (p.id === produitAModifier.id ? misAJour : p))
        )
      }
      setShowModal(false)
      setFormData(champsVideCatalogue)
    } catch (err) {
      setErreurModal(err.message)
    } finally {
      setEnregistrement(false)
    }
  }

  const supprimer = async id => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce produit du catalogue ?')) return

    try {
      await deleteProduit(id)
      setProduits(current => current.filter(p => p.id !== id))
    } catch (err) {
      window.alert(err.message)
    }
  }

  const produitsFiltres = produits.filter(p =>
    (p.nomProduit?.toLowerCase() || '').includes(recherche.toLowerCase()) ||
    (p.categorie?.toLowerCase() || '').includes(recherche.toLowerCase())
  )

  return (
    <>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
          <input
            type='text'
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder='Rechercher un produit...'
            className='pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-72'
          />
        </div>
        <button
          onClick={ouvrirAjout}
          className='flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors shadow-md shadow-blue-600/20 cursor-pointer w-fit'
        >
          <Plus className='w-4 h-4' />
          Ajouter un produit
        </button>
      </div>

      {erreurChargement && (
        <p className='mt-4 text-sm text-red-500'>{erreurChargement}</p>
      )}

      <div className='mt-6 bg-white rounded-2xl border border-slate-200 overflow-hidden'>
        <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='bg-slate-50 text-left text-sm text-slate-500'>
              <th className='px-6 py-3 font-medium'>Produit</th>
              <th className='px-6 py-3 font-medium'>Catégorie</th>
              <th className='px-6 py-3 font-medium'>Prix</th>
              <th className='px-6 py-3 font-medium'>Stock</th>
              <th className='px-6 py-3 font-medium'>Statut</th>
              <th className='px-6 py-3 font-medium'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {chargement ? (
              <tr>
                <td colSpan='6' className='px-6 py-12 text-center text-slate-400'>
                  Chargement...
                </td>
              </tr>
            ) : produitsFiltres.length > 0 ? (
              produitsFiltres.map(produit => (
                <tr key={produit.id} className='hover:bg-slate-50 transition-colors'>
                  <td className='px-6 py-4'>
                    <div className='flex flex-wrap items-center gap-3'>
                      {produit.image ? (
                        <img
                          src={resolveMediaUrl(produit.image)}
                          alt={produit.nomProduit}
                          className='w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0'
                        />
                      ) : (
                        <div className='w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0'>
                          <Package className='w-4 h-4 text-slate-400' />
                        </div>
                      )}
                      <span className='text-sm font-medium text-slate-800'>
                        {produit.nomProduit}
                      </span>
                    </div>
                  </td>
                  <td className='px-6 py-4 text-sm text-slate-600'>
                    {produit.categorie}
                  </td>
                  <td className='px-6 py-4 text-sm font-medium text-slate-800'>
                    {formatMontant(produit.montant)}
                  </td>
                  <td className='px-6 py-4 text-sm text-slate-600'>
                    {produit.stock}
                  </td>
                  <td className='px-6 py-4'>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        statutCatalogueStyle[produit.statut]
                      }`}
                    >
                      {produit.statut}
                    </span>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => ouvrirModification(produit)}
                        className='p-2 text-slate-400 hover:text-sky-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer'
                        title='Modifier'
                      >
                        <Pencil className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => supprimer(produit.id)}
                        className='p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer'
                        title='Supprimer'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan='6' className='px-6 py-12 text-center text-slate-400'>
                  Aucun produit trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-2xl p-6 w-full max-w-md shadow-xl'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-bold text-slate-800'>
                {modeModal === 'ajouter' ? 'Ajouter un produit' : 'Modifier le produit'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className='p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Nom du produit
                </label>
                <input
                  type='text'
                  value={formData.nom}
                  onChange={e => setFormData({ ...formData, nom: e.target.value })}
                  placeholder='Ex: MacBook Pro 14...'
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Catégorie
                </label>
                <select
                  value={formData.categorie}
                  onChange={e => setFormData({ ...formData, categorie: e.target.value })}
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>
                    Prix (FCFA)
                  </label>
                  <input
                    type='number'
                    min='0'
                    step='1'
                    value={formData.prix}
                    onChange={e => setFormData({ ...formData, prix: e.target.value })}
                    placeholder='Ex: 450000'
                    className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>
                    Stock
                  </label>
                  <input
                    type='number'
                    min='0'
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    placeholder='0'
                    className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Image
                </label>
                <div className='flex flex-wrap items-center gap-3'>
                  {formData.image ? (
                    <img
                      src={resolveMediaUrl(formData.image)}
                      alt=''
                      className='w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0'
                    />
                  ) : (
                    <div className='w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0'>
                      <Package className='w-5 h-5 text-slate-400' />
                    </div>
                  )}
                  <label
                    className={`flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors ${
                      televersement ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {televersement ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <Upload className='w-4 h-4' />
                    )}
                    {televersement ? 'Envoi...' : 'Choisir une image'}
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleImageChange}
                      disabled={televersement}
                      className='hidden'
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder='Courte description du produit...'
                  rows={3}
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Statut
                </label>
                <select
                  value={formData.statut}
                  onChange={e => setFormData({ ...formData, statut: e.target.value })}
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {statutsCatalogue.map(statut => (
                    <option key={statut} value={statut}>
                      {statut}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {erreurModal && (
              <p className='mt-4 text-sm text-red-500'>{erreurModal}</p>
            )}

            <div className='flex gap-3 mt-6'>
              <button
                onClick={() => setShowModal(false)}
                disabled={enregistrement}
                className='flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Annuler
              </button>
              <button
                onClick={sauvegarder}
                disabled={enregistrement || televersement}
                className='flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {enregistrement
                  ? 'Enregistrement...'
                  : modeModal === 'ajouter'
                    ? 'Ajouter'
                    : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ───────────────── Section : Produits demandés ───────────────── */

function ProduitsDemandes () {
  const [demandes, setDemandes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('Tous')
  const [showFiltre, setShowFiltre] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ statut: 'Préparation' })
  const [demandeAModifier, setDemandeAModifier] = useState(null)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreurModal, setErreurModal] = useState('')

  useEffect(() => {
    let annule = false
    getDemandesProduits()
      .then(data => {
        if (!annule) setDemandes(data)
      })
      .catch(err => {
        if (!annule) setErreurChargement(err.message)
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  const ouvrirModification = demande => {
    setDemandeAModifier(demande)
    setFormData({ statut: demande.statut })
    setErreurModal('')
    setShowModal(true)
  }

  const sauvegarder = async () => {
    setEnregistrement(true)
    setErreurModal('')
    try {
      const misAJour = await updateDemandeProduitStatut(demandeAModifier.id, formData.statut)
      setDemandes(current =>
        current.map(d => (d.id === demandeAModifier.id ? misAJour : d))
      )
      setShowModal(false)
    } catch (err) {
      setErreurModal(err.message)
    } finally {
      setEnregistrement(false)
    }
  }

  const supprimer = async id => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette demande ?')) return

    try {
      await deleteDemandeProduit(id)
      setDemandes(current => current.filter(d => d.id !== id))
    } catch (err) {
      window.alert(err.message)
    }
  }

  const demandesFiltrees = demandes.filter(d => {
    const matchRecherche =
      (d.nomProduit?.toLowerCase() || '').includes(recherche.toLowerCase()) ||
      (d.clientNom?.toLowerCase() || '').includes(recherche.toLowerCase())
    const matchStatut = filtreStatut === 'Tous' || d.statut === filtreStatut
    return matchRecherche && matchStatut
  })

  return (
    <>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6'>
        <span className='text-sm text-slate-500'>
          {demandesFiltrees.length} demande{demandesFiltrees.length > 1 && 's'} trouvée
          {demandesFiltrees.length > 1 && 's'}
        </span>
        <div className='flex flex-wrap items-center gap-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
            <input
              type='text'
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              placeholder='Rechercher...'
              className='pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <button
            onClick={() => setShowFiltre(!showFiltre)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filtreStatut !== 'Tous'
                ? 'bg-blue-50 border-blue-300 text-sky-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className='w-4 h-4' />
            Filtrer
          </button>
        </div>
      </div>

      {showFiltre && (
        <div className='flex items-center gap-2 mt-4 flex-wrap'>
          {statutsDemandes.map(statut => (
            <button
              key={statut}
              onClick={() => setFiltreStatut(statut)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                filtreStatut === statut
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {statut}
            </button>
          ))}
          {filtreStatut !== 'Tous' && (
            <button
              onClick={() => setFiltreStatut('Tous')}
              className='flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-full cursor-pointer'
            >
              <X className='w-3 h-3' />
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {erreurChargement && (
        <p className='mt-4 text-sm text-red-500'>{erreurChargement}</p>
      )}

      <div className='mt-6 bg-white rounded-2xl border border-slate-200 overflow-hidden'>
        <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='bg-slate-50 text-left text-sm text-slate-500'>
              <th className='px-6 py-3 font-medium'>Produit demandé</th>
              <th className='px-6 py-3 font-medium'>Client</th>
              <th className='px-6 py-3 font-medium'>Quantité</th>
              <th className='px-6 py-3 font-medium'>Date</th>
              <th className='px-6 py-3 font-medium'>Montant</th>
              <th className='px-6 py-3 font-medium'>Statut</th>
              <th className='px-6 py-3 font-medium'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {chargement ? (
              <tr>
                <td colSpan='7' className='px-6 py-12 text-center text-slate-400'>
                  Chargement...
                </td>
              </tr>
            ) : demandesFiltrees.length > 0 ? (
              demandesFiltrees.map(demande => (
                <tr key={demande.id} className='hover:bg-slate-50 transition-colors'>
                  <td className='px-6 py-4 text-sm text-slate-600'>{demande.nomProduit}</td>
                  <td className='px-6 py-4 text-sm text-slate-600'>{demande.clientNom}</td>
                  <td className='px-6 py-4 text-sm text-slate-600'>{demande.quantite}</td>
                  <td className='px-6 py-4 text-sm text-slate-500'>
                    {new Date(demande.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className='px-6 py-4 text-sm font-medium text-slate-800'>
                    {formatMontant(demande.montantUnitaire * demande.quantite)}
                  </td>
                  <td className='px-6 py-4'>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        statutDemandeStyle[demande.statut]
                      }`}
                    >
                      {demande.statut}
                    </span>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => ouvrirModification(demande)}
                        className='p-2 text-slate-400 hover:text-sky-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer'
                        title='Modifier le statut'
                      >
                        <Pencil className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => supprimer(demande.id)}
                        className='p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer'
                        title='Supprimer'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan='7' className='px-6 py-12 text-center text-slate-400'>
                  Aucune demande trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-2xl p-6 w-full max-w-md shadow-xl'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-bold text-slate-800'>Traiter la demande</h2>
              <button
                onClick={() => setShowModal(false)}
                className='p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='space-y-4'>
              <p className='text-sm text-slate-500'>
                {demandeAModifier?.nomProduit} — {demandeAModifier?.clientNom}
              </p>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Statut
                </label>
                <select
                  value={formData.statut}
                  onChange={e => setFormData({ ...formData, statut: e.target.value })}
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='Préparation'>Préparation</option>
                  <option value='En cours'>En cours</option>
                  <option value='Livrée'>Livrée</option>
                  <option value='Annulée'>Annulée</option>
                </select>
              </div>
            </div>

            {erreurModal && (
              <p className='mt-4 text-sm text-red-500'>{erreurModal}</p>
            )}

            <div className='flex gap-3 mt-6'>
              <button
                onClick={() => setShowModal(false)}
                disabled={enregistrement}
                className='flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Annuler
              </button>
              <button
                onClick={sauvegarder}
                disabled={enregistrement}
                className='flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
