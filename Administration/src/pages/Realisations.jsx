import {
  Search,
  X,
  Pencil,
  Trash2,
  Plus,
  ImageIcon,
  Upload,
  Loader2
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  getRealisations,
  createRealisation,
  updateRealisation,
  deleteRealisation,
  uploadRealisationImage
} from '../api/realisations'
import { resolveMediaUrl } from '../api/client'

const categories = ['Site Vitrine', 'Application Web', 'Mobile', 'ERP / Logiciel', 'Design', 'E-commerce']

const champsVide = {
  titre: '',
  categorie: categories[0],
  technologies: '',
  image: '',
  description: '',
  lien: ''
}

export default function Realisations () {
  const [realisations, setRealisations] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState('')
  const [recherche, setRecherche] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [modeModal, setModeModal] = useState('ajouter')
  const [formData, setFormData] = useState(champsVide)
  const [realisationAModifier, setRealisationAModifier] = useState(null)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreurModal, setErreurModal] = useState('')
  const [televersement, setTeleversement] = useState(false)

  useEffect(() => {
    let annule = false
    getRealisations()
      .then(data => {
        if (!annule) setRealisations(data)
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
    setFormData(champsVide)
    setErreurModal('')
    setShowModal(true)
  }

  const ouvrirModification = realisation => {
    setModeModal('modifier')
    setRealisationAModifier(realisation)
    setFormData({
      titre: realisation.titre,
      categorie: realisation.categorie,
      technologies: realisation.technologies,
      image: realisation.image || '',
      description: realisation.description || '',
      lien: realisation.lien || ''
    })
    setErreurModal('')
    setShowModal(true)
  }

  const handleImageChange = async event => {
    const fichier = event.target.files?.[0]
    event.target.value = ''
    if (!fichier) return

    setTeleversement(true)
    setErreurModal('')
    try {
      const { url } = await uploadRealisationImage(fichier)
      setFormData(current => ({ ...current, image: url }))
    } catch (err) {
      setErreurModal(err.message)
    } finally {
      setTeleversement(false)
    }
  }

  const sauvegarder = async () => {
    if (!formData.titre || !formData.technologies) return

    const payload = {
      titre: formData.titre,
      categorie: formData.categorie,
      technologies: formData.technologies,
      image: formData.image || null,
      description: formData.description || null,
      lien: formData.lien || null
    }

    setEnregistrement(true)
    setErreurModal('')
    try {
      if (modeModal === 'ajouter') {
        const nouvelle = await createRealisation(payload)
        setRealisations(current => [nouvelle, ...current])
      } else {
        const misAJour = await updateRealisation(realisationAModifier.id, payload)
        setRealisations(current =>
          current.map(r => (r.id === realisationAModifier.id ? misAJour : r))
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

  const supprimer = async id => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette réalisation ?')) return

    try {
      await deleteRealisation(id)
      setRealisations(current => current.filter(r => r.id !== id))
    } catch (err) {
      window.alert(err.message)
    }
  }

  const realisationsFiltrees = realisations.filter(r =>
    (r.titre?.toLowerCase() || '').includes(recherche.toLowerCase()) ||
    (r.categorie?.toLowerCase() || '').includes(recherche.toLowerCase())
  )

  return (
    <section className='max-w-full'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200'>
        <div>
          <h1 className='text-lg md:text-3xl font-bold text-slate-800'>Réalisations</h1>
          <span className='text-sm text-slate-500'>Portfolio affiché sur le site public</span>
        </div>
      </div>

      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
          <input
            type='text'
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder='Rechercher une réalisation...'
            className='pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-72'
          />
        </div>
        <button
          onClick={ouvrirAjout}
          className='flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors shadow-md shadow-blue-600/20 cursor-pointer w-fit'
        >
          <Plus className='w-4 h-4' />
          Ajouter une réalisation
        </button>
      </div>

      {erreurChargement && <p className='mt-4 text-sm text-red-500'>{erreurChargement}</p>}

      <div className='mt-6 bg-white rounded-2xl border border-slate-200 overflow-hidden'>
        <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='bg-slate-50 text-left text-sm text-slate-500'>
              <th className='px-6 py-3 font-medium'>Réalisation</th>
              <th className='px-6 py-3 font-medium'>Catégorie</th>
              <th className='px-6 py-3 font-medium'>Technologies</th>
              <th className='px-6 py-3 font-medium'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {chargement ? (
              <tr>
                <td colSpan='4' className='px-6 py-12 text-center text-slate-400'>
                  Chargement...
                </td>
              </tr>
            ) : realisationsFiltrees.length > 0 ? (
              realisationsFiltrees.map(realisation => (
                <tr key={realisation.id} className='hover:bg-slate-50 transition-colors'>
                  <td className='px-6 py-4'>
                    <div className='flex flex-wrap items-center gap-3'>
                      {realisation.image ? (
                        <img
                          src={resolveMediaUrl(realisation.image)}
                          alt={realisation.titre}
                          className='w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0'
                        />
                      ) : (
                        <div className='w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0'>
                          <ImageIcon className='w-4 h-4 text-slate-400' />
                        </div>
                      )}
                      <span className='text-sm font-medium text-slate-800'>{realisation.titre}</span>
                    </div>
                  </td>
                  <td className='px-6 py-4 text-sm text-slate-600'>{realisation.categorie}</td>
                  <td className='px-6 py-4 text-sm text-slate-600'>{realisation.technologies}</td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => ouvrirModification(realisation)}
                        className='p-2 text-slate-400 hover:text-sky-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer'
                        title='Modifier'
                      >
                        <Pencil className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => supprimer(realisation.id)}
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
                <td colSpan='4' className='px-6 py-12 text-center text-slate-400'>
                  Aucune réalisation trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-bold text-slate-800'>
                {modeModal === 'ajouter' ? 'Ajouter une réalisation' : 'Modifier la réalisation'}
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
                <label className='block text-sm font-medium text-slate-700 mb-1'>Titre</label>
                <input
                  type='text'
                  value={formData.titre}
                  onChange={e => setFormData({ ...formData, titre: e.target.value })}
                  placeholder='Ex: AfroPay'
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Catégorie</label>
                <select
                  value={formData.categorie}
                  onChange={e => setFormData({ ...formData, categorie: e.target.value })}
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Technologies (séparées par des virgules)
                </label>
                <input
                  type='text'
                  value={formData.technologies}
                  onChange={e => setFormData({ ...formData, technologies: e.target.value })}
                  placeholder='Ex: React, Node.js, MongoDB'
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Image</label>
                <div className='flex flex-wrap items-center gap-3'>
                  {formData.image ? (
                    <img
                      src={resolveMediaUrl(formData.image)}
                      alt=''
                      className='w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0'
                    />
                  ) : (
                    <div className='w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0'>
                      <ImageIcon className='w-5 h-5 text-slate-400' />
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
                <label className='block text-sm font-medium text-slate-700 mb-1'>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder='Courte description du projet...'
                  rows={3}
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Lien du projet (optionnel)
                </label>
                <input
                  type='url'
                  value={formData.lien}
                  onChange={e => setFormData({ ...formData, lien: e.target.value })}
                  placeholder='https://...'
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>

            {erreurModal && <p className='mt-4 text-sm text-red-500'>{erreurModal}</p>}

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
    </section>
  )
}
