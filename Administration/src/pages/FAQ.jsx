import { Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getFaqs, createFaq, updateFaq, deleteFaq } from '../api/faq'

const categoriesListe = ['Tarifs', 'Délais', 'Services', 'Boutique', 'Général']

const categorieStyle = {
  Tarifs: 'text-cyan-700 border-cyan-300 bg-cyan-50',
  Délais: 'text-sky-700 border-blue-300 bg-blue-50',
  Services: 'text-emerald-700 border-emerald-300 bg-emerald-50',
  Boutique: 'text-violet-700 border-violet-300 bg-violet-50',
  Général: 'text-slate-600 border-slate-300 bg-slate-50'
}

const statutStyle = {
  Publiée: 'text-green-700 bg-green-100',
  Brouillon: 'text-slate-600 bg-slate-100'
}

const champsVide = {
  question: '',
  reponse: '',
  categorie: 'Général',
  statut: 'Publiée'
}

export default function GestionFAQ () {
  const [faqs, setFaqs] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [modeModal, setModeModal] = useState('ajouter')
  const [formData, setFormData] = useState(champsVide)
  const [faqAModifier, setFaqAModifier] = useState(null)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreurModal, setErreurModal] = useState('')

  useEffect(() => {
    let annule = false
    getFaqs()
      .then(data => {
        if (!annule) setFaqs(data)
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

  const ouvrirModification = faq => {
    setModeModal('modifier')
    setFaqAModifier(faq)
    setFormData({
      question: faq.question,
      reponse: faq.reponse,
      categorie: faq.categorie,
      statut: faq.statut
    })
    setErreurModal('')
    setShowModal(true)
  }

  const sauvegarder = async () => {
    if (!formData.question.trim() || !formData.reponse.trim()) return

    setEnregistrement(true)
    setErreurModal('')
    try {
      if (modeModal === 'ajouter') {
        const nouvelle = await createFaq(formData)
        setFaqs(current => [...current, nouvelle])
      } else {
        const misAJour = await updateFaq(faqAModifier.id, formData)
        setFaqs(current =>
          current.map(f => (f.id === faqAModifier.id ? misAJour : f))
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
    if (!window.confirm('Voulez-vous vraiment supprimer cette question ?')) return

    try {
      await deleteFaq(id)
      setFaqs(current => current.filter(f => f.id !== id))
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <section className='max-w-full'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl md:text-3xl font-bold text-slate-800'>
          Gestion de la FAQ
        </h1>
        <button
          onClick={ouvrirAjout}
          className='flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 transition-colors shadow-md shadow-cyan-600/20 cursor-pointer'
        >
          <Plus className='w-4 h-4' />
          Ajouter une question
        </button>
      </div>

      {erreurChargement && (
        <p className='mb-4 text-sm text-red-500'>{erreurChargement}</p>
      )}

      {/* Tableau */}
      <div className='bg-white rounded-2xl border border-slate-200 overflow-hidden'>
        <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='text-left text-xs font-semibold text-slate-500 uppercase tracking-wide'>
              <th className='px-6 py-4'>Question</th>
              <th className='px-6 py-4 text-center'>Catégorie</th>
              <th className='px-6 py-4 text-center'>Statut</th>
              <th className='px-6 py-4 text-center'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {chargement ? (
              <tr>
                <td colSpan='4' className='px-6 py-12 text-center text-slate-400'>
                  Chargement...
                </td>
              </tr>
            ) : faqs.length > 0 ? (
              faqs.map(faq => (
                <tr
                  key={faq.id}
                  className='hover:bg-slate-50/50 transition-colors'
                >
                  <td className='px-6 py-4 text-sm text-slate-700'>
                    {faq.question}
                  </td>
                  <td className='px-6 py-4 text-center'>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${
                        categorieStyle[faq.categorie] || categorieStyle.Général
                      }`}
                    >
                      {faq.categorie}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-center'>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        statutStyle[faq.statut]
                      }`}
                    >
                      {faq.statut}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-center'>
                    <div className='flex items-center justify-center gap-4'>
                      <button
                        onClick={() => ouvrirModification(faq)}
                        className='text-sm font-medium text-cyan-600 hover:text-cyan-800 transition-colors cursor-pointer'
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => supprimer(faq.id)}
                        className='text-sm font-medium text-red-500 hover:text-red-700 transition-colors cursor-pointer'
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan='4'
                  className='px-6 py-12 text-center text-slate-400'
                >
                  Aucune question dans la FAQ
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
          <div className='bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-bold text-slate-800'>
                {modeModal === 'ajouter'
                  ? 'Nouvelle question'
                  : 'Modifier la question'}
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
                <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
                  Question
                </label>
                <input
                  type='text'
                  value={formData.question}
                  onChange={e =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder='Ex: Quels sont vos délais de livraison ?'
                  className='w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'
                />
              </div>

              <div>
                <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
                  Réponse
                </label>
                <textarea
                  value={formData.reponse}
                  onChange={e =>
                    setFormData({ ...formData, reponse: e.target.value })
                  }
                  placeholder='Rédigez la réponse à afficher...'
                  rows={4}
                  className='w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
                    Catégorie
                  </label>
                  <select
                    value={formData.categorie}
                    onChange={e =>
                      setFormData({ ...formData, categorie: e.target.value })
                    }
                    className='w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'
                  >
                    {categoriesListe.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
                    Statut
                  </label>
                  <select
                    value={formData.statut}
                    onChange={e =>
                      setFormData({ ...formData, statut: e.target.value })
                    }
                    className='w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'
                  >
                    <option value='Publiée'>Publiée</option>
                    <option value='Brouillon'>Brouillon</option>
                  </select>
                </div>
              </div>
            </div>

            {erreurModal && (
              <p className='mt-4 text-sm text-red-500'>{erreurModal}</p>
            )}

            <div className='flex gap-3 mt-6'>
              <button
                onClick={() => setShowModal(false)}
                disabled={enregistrement}
                className='flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Annuler
              </button>
              <button
                onClick={sauvegarder}
                disabled={enregistrement}
                className='flex-1 px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-colors shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
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
