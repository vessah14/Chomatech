import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import StarRating from '../../Components/ui/StarRating'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { getMesAvis, createAvis } from '../../api/avis'

const statutStyle = {
  'En attente': 'text-amber-700 bg-amber-100',
  Publiée: 'text-green-700 bg-green-100'
}

function formatDate (iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

export default function MesAvis () {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [avis, setAvis] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState('')

  const [note, setNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreurEnvoi, setErreurEnvoi] = useState('')
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    if (!user) return
    let annule = false
    getMesAvis(user.id)
      .then(data => {
        if (!annule) setAvis(data)
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
  }, [user])

  const envoyerAvis = async () => {
    if (note === 0 || !commentaire.trim()) return

    setEnvoi(true)
    setErreurEnvoi('')
    try {
      const nouveau = await createAvis(note, commentaire)
      setAvis(current => [nouveau, ...current])
      setNote(0)
      setCommentaire('')
      setSucces(true)
      setTimeout(() => setSucces(false), 4000)
    } catch (err) {
      setErreurEnvoi(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <section className='max-w-3xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-extrabold text-gray-900'>{t.adminMyReviewTitle}</h1>
        <p className='text-gray-500 mt-1'>
          {t.adminReviewIntro}
        </p>
      </div>

      {/* Formulaire */}
      <div className='rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
        <label className='mb-2 block text-sm font-semibold text-gray-700'>
          {t.adminYourRating}
        </label>
        <StarRating value={note} onChange={setNote} size={32} />

        <label className='mb-2 mt-5 block text-sm font-semibold text-gray-700'>
          {t.adminYourComment}
        </label>
        <textarea
          value={commentaire}
          onChange={e => setCommentaire(e.target.value)}
          placeholder={t.adminReviewPlaceholder}
          rows={4}
          className='w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/40'
        />

        {erreurEnvoi && <p className='mt-3 text-sm text-red-500'>{erreurEnvoi}</p>}
        {succes && (
          <p className='mt-3 text-sm text-emerald-600'>
            {t.adminReviewSuccessShort}
          </p>
        )}

        <button
          onClick={envoyerAvis}
          disabled={envoi || note === 0 || !commentaire.trim()}
          className='mt-5 flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3 font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50'
        >
          <Send className='h-4 w-4' />
          {envoi ? t.sending : t.adminSendReview}
        </button>
      </div>

      {/* Historique */}
      <div>
        <h2 className='text-lg font-bold text-gray-900 mb-4'>{t.adminPreviousReviews}</h2>

        {erreurChargement && (
          <p className='text-sm text-red-500 mb-4'>{erreurChargement}</p>
        )}

        {chargement ? (
          <p className='text-sm text-gray-400'>{t.loading}</p>
        ) : avis.length > 0 ? (
          <div className='space-y-3'>
            {avis.map(a => (
              <div
                key={a.id}
                className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'
              >
                <div className='flex items-start justify-between gap-3'>
                  <StarRating value={a.note} readOnly size={16} />
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statutStyle[a.statut]}`}
                  >
                    {a.statut}
                  </span>
                </div>
                <p className='mt-3 text-sm text-gray-600 italic'>
                  "{a.commentaire}"
                </p>
                <p className='mt-2 text-xs text-gray-400'>
                  {formatDate(a.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-gray-400'>
            {t.adminNoReviewsYet}
          </p>
        )}
      </div>
    </section>
  )
}
