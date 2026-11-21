import {
  Search,
  Filter,
  X,
  Pencil,
  Trash2,
  Plus,
  Pin,
  PinOff
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAnnonces, createAnnonce, updateAnnonce, deleteAnnonce } from '../api/annonces'

const statuts = ['Tous', 'Publiée', 'Brouillon']

const categoriesListe = [
  'Recrutement',
  'Promotion',
  'Événement',
  'Information',
  'Autre'
]

const statutStyle = {
  Publiée: 'text-green-700 bg-green-100',
  Brouillon: 'text-gray-700 bg-gray-100'
}

const champsVide = {
  titre: '',
  categorie: 'Information',
  epinglee: false,
  statut: 'Brouillon'
}

export default function Annonces () {
  const [annonces, setAnnonces] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('Tous')
  const [showFiltre, setShowFiltre] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [modeModal, setModeModal] = useState('ajouter')
  const [formData, setFormData] = useState(champsVide)
  const [annonceAModifier, setAnnonceAModifier] = useState(null)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreurModal, setErreurModal] = useState('')

  useEffect(() => {
    let annule = false
    getAnnonces()
      .then(data => {
        if (!annule) setAnnonces(data)
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

  // Ouvrir modal ajout
  const ouvrirAjout = () => {
    setModeModal('ajouter')
    setFormData(champsVide)
    setErreurModal('')
    setShowModal(true)
  }

  // Ouvrir modal modification
  const ouvrirModification = annonce => {
    setModeModal('modifier')
    setAnnonceAModifier(annonce)
    setFormData({
      titre: annonce.titre,
      categorie: annonce.categorie,
      epinglee: annonce.epingle,
      statut: annonce.statut
    })
    setErreurModal('')
    setShowModal(true)
  }

  // Sauvegarder (ajout ou modification)
  const sauvegarder = async () => {
    if (!formData.titre) return

    const payload = {
      titre: formData.titre,
      categorie: formData.categorie,
      epingle: formData.epinglee,
      statut: formData.statut
    }

    setEnregistrement(true)
    setErreurModal('')
    try {
      if (modeModal === 'ajouter') {
        const nouvelle = await createAnnonce(payload)
        setAnnonces(current => [nouvelle, ...current])
      } else {
        const misAJour = await updateAnnonce(annonceAModifier.id, payload)
        setAnnonces(current =>
          current.map(a => (a.id === annonceAModifier.id ? misAJour : a))
        )
      }
      setShowModal(false)
      setFormData(champsVide)
    } catch (err) {
      setErreurModal(err.message)
    } finally {
      setEnregistrement(false)
    }
  }

  // Épingler / Désépingler
  const toggleEpingle = async annonce => {
    try {
      const misAJour = await updateAnnonce(annonce.id, {
        titre: annonce.titre,
        categorie: annonce.categorie,
        epingle: !annonce.epingle,
        statut: annonce.statut
      })
      setAnnonces(current => current.map(a => (a.id === annonce.id ? misAJour : a)))
    } catch (err) {
      window.alert(err.message)
    }
  }

  // Supprimer
  const supprimer = async id => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette annonce ?')) return

    try {
      await deleteAnnonce(id)
      setAnnonces(current => current.filter(a => a.id !== id))
    } catch (err) {
      window.alert(err.message)
    }
  }

  // Filtrage
  const annoncesFiltrees = annonces.filter(a => {
    const matchRecherche =
      (a.titre?.toLowerCase() || '').includes(recherche.toLowerCase()) ||
      (a.categorie?.toLowerCase() || '').includes(recherche.toLowerCase())
    const matchStatut = filtreStatut === 'Tous' || a.statut === filtreStatut
    return matchRecherche && matchStatut
  })

  return (
    <section className='max-w-full'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200'>
        <div>
          <h1 className='text-lg md:text-3xl font-bold text-slate-800'>
            Gestion des annonces
          </h1>
          <span className='text-sm text-slate-500'>
            {annoncesFiltrees.length} annonce
            {annoncesFiltrees.length > 1 && 's'} trouvée
            {annoncesFiltrees.length > 1 && 's'}
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
            <input
              type='text'
              onChange={e => setRecherche(e.target.value)}
              placeholder='Rechercher une annonce...'
              value={recherche}
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
          <button
            onClick={ouvrirAjout}
            className='flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors shadow-md shadow-blue-600/20 cursor-pointer'
          >
            <Plus className='w-4 h-4' />
            Nouvelle annonce
          </button>
        </div>
      </div>

      {/* Filtres par statut */}
      {showFiltre && (
        <div className='flex items-center gap-2 mt-4 flex-wrap'>
          {statuts.map(statut => (
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

      {/* Tableau */}
      <div className='mt-6 bg-white rounded-2xl border border-slate-200 overflow-hidden'>
        <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='bg-slate-50 text-left text-sm text-slate-500'>
              <th className='px-6 py-3 font-medium'>Titre</th>
              <th className='px-6 py-3 font-medium'>Catégorie</th>
              <th className='px-6 py-3 font-medium'>Date</th>
              <th className='px-6 py-3 font-medium'>Vues</th>
              <th className='px-6 py-3 font-medium'>Épinglée</th>
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
            ) : annoncesFiltrees.length > 0 ? (
              annoncesFiltrees.map(a => (
                <tr key={a.id} className='hover:bg-slate-50 transition-colors'>
                  <td className='px-6 py-4 text-sm font-medium text-slate-700'>
                    {a.titre}
                  </td>
                  <td className='px-6 py-4'>
                    <span className='px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-sky-700 inline-flex items-center justify-center'>
                      {a.categorie}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-sm text-slate-500'>
                    {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className='px-6 py-4 text-sm font-medium text-slate-800'>
                    {a.vues.toLocaleString('fr-FR')}
                  </td>
                  <td className='px-6 py-4'>
                    <button
                      onClick={() => toggleEpingle(a)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        a.epingle
                          ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                          : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                      }`}
                      title={a.epingle ? 'Désépingler' : 'Épingler'}
                    >
                      {a.epingle ? (
                        <Pin className='w-4 h-4' />
                      ) : (
                        <PinOff className='w-4 h-4' />
                      )}
                    </button>
                  </td>
                  <td className='px-6 py-4'>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        statutStyle[a.statut]
                      }`}
                    >
                      {a.statut}
                    </span>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => ouvrirModification(a)}
                        className='p-2 text-slate-400 hover:text-sky-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer'
                        title='Modifier'
                      >
                        <Pencil className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => supprimer(a.id)}
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
                <td
                  colSpan='7'
                  className='px-6 py-12 text-center text-slate-400'
                >
                  Aucune annonce trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal Ajouter / Modifier */}
      {showModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl p-6 w-full max-w-md shadow-xl'>
            {/* Header modal */}
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-bold text-slate-800'>
                {modeModal === 'ajouter'
                  ? 'Nouvelle annonce'
                  : "Modifier l'annonce"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className='p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Formulaire */}
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Titre de l'annonce
                </label>
                <input
                  type='text'
                  value={formData.titre}
                  onChange={e =>
                    setFormData({ ...formData, titre: e.target.value })
                  }
                  placeholder='Ex: Offre spéciale rentrée...'
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Catégorie
                </label>
                <select
                  value={formData.categorie}
                  onChange={e =>
                    setFormData({ ...formData, categorie: e.target.value })
                  }
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {categoriesListe.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Statut
                </label>
                <select
                  value={formData.statut}
                  onChange={e =>
                    setFormData({ ...formData, statut: e.target.value })
                  }
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='Brouillon'>Brouillon</option>
                  <option value='Publiée'>Publiée</option>
                </select>
              </div>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={formData.epinglee}
                  onChange={e =>
                    setFormData({ ...formData, epinglee: e.target.checked })
                  }
                  className='w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-blue-500'
                />
                <span className='text-sm font-medium text-slate-700'>
                  Épingler cette annonce
                </span>
              </label>
            </div>

            {erreurModal && (
              <p className='mt-4 text-sm text-red-500'>{erreurModal}</p>
            )}

            {/* Boutons */}
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
                {enregistrement
                  ? 'Enregistrement...'
                  : modeModal === 'ajouter'
                    ? 'Publier'
                    : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
