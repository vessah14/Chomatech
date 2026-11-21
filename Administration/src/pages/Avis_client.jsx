import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAllAvis, updateAvisStatut, deleteAvis } from '../api/avis'

const palette = [
  'bg-cyan-600',
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-violet-600'
]

function couleurPour (clientId) {
  let hash = 0
  for (let i = 0; i < clientId.length; i++) hash = (hash + clientId.charCodeAt(i)) % palette.length
  return palette[hash]
}

function Etoiles ({ note }) {
  return (
    <div className='flex gap-0.5'>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= note
              ? 'fill-amber-400 text-amber-400'
              : 'fill-slate-200 text-slate-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function ModerationAvis () {
  const [avis, setAvis] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false
    getAllAvis()
      .then(data => {
        if (!annule) setAvis(data)
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

  const changerStatut = async (id, statut) => {
    try {
      const misAJour = await updateAvisStatut(id, statut)
      setAvis(current => current.map(a => (a.id === id ? misAJour : a)))
    } catch (err) {
      window.alert(err.message)
    }
  }

  const supprimer = async id => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet avis ?')) return

    try {
      await deleteAvis(id)
      setAvis(current => current.filter(a => a.id !== id))
    } catch (err) {
      window.alert(err.message)
    }
  }

  const publiees = avis.filter(a => a.statut === 'Publiée').length
  const enAttente = avis.filter(a => a.statut === 'En attente').length
  const noteMoyenne =
    avis.length > 0
      ? (avis.reduce((sum, a) => sum + a.note, 0) / avis.length).toFixed(1)
      : '—'

  return (
    <section className='max-w-full'>
      <h1 className='text-2xl md:text-3xl font-bold text-slate-800 mb-6'>
        Modération des avis
      </h1>

      {erreur && <p className='mb-4 text-sm text-red-500'>{erreur}</p>}

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
        <div className='bg-white rounded-2xl border border-slate-200 py-6 text-center'>
          <p className='text-3xl font-bold text-slate-800'>{publiees}</p>
          <p className='text-sm text-slate-500 mt-1'>Avis publiés</p>
        </div>
        <div className='bg-white rounded-2xl border border-slate-200 py-6 text-center'>
          <p className='text-3xl font-bold text-slate-800'>{enAttente}</p>
          <p className='text-sm text-slate-500 mt-1'>En attente</p>
        </div>
        <div className='bg-white rounded-2xl border border-slate-200 py-6 text-center'>
          <div className='flex items-center justify-center gap-2'>
            <span className='text-3xl font-bold text-slate-800'>
              {noteMoyenne}
            </span>
            <Star className='w-6 h-6 fill-amber-400 text-amber-400' />
          </div>
          <p className='text-sm text-slate-500 mt-1'>Note moyenne</p>
        </div>
      </div>

      {/* Liste des avis */}
      <div className='space-y-4'>
        {chargement ? (
          <div className='bg-white rounded-2xl border border-slate-200 py-12 text-center text-slate-400'>
            Chargement...
          </div>
        ) : avis.length > 0 ? (
          avis.map(a => (
            <div
              key={a.id}
              className={`bg-white rounded-2xl border overflow-hidden ${
                a.statut === 'En attente'
                  ? 'border-amber-200'
                  : 'border-slate-200'
              }`}
            >
              <div className='flex'>
                <div
                  className={`w-1.5 shrink-0 ${
                    a.statut === 'En attente' ? 'bg-amber-400' : 'bg-cyan-500'
                  }`}
                />

                <div className='flex-1 p-5'>
                  <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4'>
                    <div className='flex items-start gap-3'>
                      <div
                        className={`${couleurPour(a.clientId)} w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0`}
                      >
                        {a.clientNom?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className='text-sm font-bold text-slate-800'>
                          {a.clientNom}
                        </h3>
                        <Etoiles note={a.note} />
                      </div>
                    </div>

                    <div className='flex items-center flex-wrap gap-3 shrink-0'>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          a.statut === 'Publiée'
                            ? 'text-green-700 bg-green-100'
                            : 'text-amber-700 bg-amber-100'
                        }`}
                      >
                        {a.statut}
                      </span>
                      {a.statut === 'Publiée' ? (
                        <button
                          onClick={() => changerStatut(a.id, 'En attente')}
                          className='text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer'
                        >
                          Masquer
                        </button>
                      ) : (
                        <button
                          onClick={() => changerStatut(a.id, 'Publiée')}
                          className='text-sm font-medium text-cyan-600 hover:text-cyan-800 transition-colors cursor-pointer'
                        >
                          Publier
                        </button>
                      )}
                      <button
                        onClick={() => supprimer(a.id)}
                        className='text-sm font-medium text-red-500 hover:text-red-700 transition-colors cursor-pointer'
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <p className='text-sm text-slate-600 italic mt-3'>
                    "{a.commentaire}"
                  </p>
                  <p className='text-xs text-slate-400 mt-1'>
                    {new Date(a.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className='bg-white rounded-2xl border border-slate-200 py-12 text-center text-slate-400'>
            Aucun avis à modérer
          </div>
        )}
      </div>
    </section>
  )
}
