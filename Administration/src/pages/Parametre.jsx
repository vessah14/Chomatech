import { useEffect, useState } from 'react'
import { getParametres, updateParametres } from '../api/parametres'

export default function Parametres () {
  const [infos, setInfos] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreurEnregistrement, setErreurEnregistrement] = useState('')
  const [sauvegarde, setSauvegarde] = useState(false)

  useEffect(() => {
    let annule = false
    getParametres()
      .then(data => {
        if (!annule) setInfos(data)
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

  const sauvegarder = async () => {
    setEnregistrement(true)
    setErreurEnregistrement('')
    try {
      const misAJour = await updateParametres({
        nomEntreprise: infos.nomEntreprise,
        slogan: infos.slogan,
        email: infos.email,
        telephone: infos.telephone,
        adresse: infos.adresse
      })
      setInfos(misAJour)
      setSauvegarde(true)
      setTimeout(() => setSauvegarde(false), 2000)
    } catch (err) {
      setErreurEnregistrement(err.message)
    } finally {
      setEnregistrement(false)
    }
  }

  if (chargement) {
    return <p className='text-sm text-slate-400'>Chargement...</p>
  }

  if (erreurChargement) {
    return <p className='text-sm text-red-500'>{erreurChargement}</p>
  }

  return (
    <section className='max-w-full'>
      <h1 className='text-2xl md:text-3xl font-bold text-slate-800 mb-6'>
        Paramètres du site
      </h1>

      <div className='max-w-xl bg-white rounded-2xl border border-slate-200 p-6'>
        <h2 className='text-lg font-bold text-slate-800 mb-6'>
          Informations générales
        </h2>

        <div className='space-y-5'>
          <div>
            <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
              Nom de l'entreprise
            </label>
            <input
              type='text'
              value={infos.nomEntreprise}
              onChange={e => setInfos({ ...infos, nomEntreprise: e.target.value })}
              className='w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500'
            />
          </div>

          <div>
            <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
              Slogan
            </label>
            <input
              type='text'
              value={infos.slogan}
              onChange={e => setInfos({ ...infos, slogan: e.target.value })}
              className='w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500'
            />
          </div>

          <div>
            <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
              Email de contact
            </label>
            <input
              type='email'
              value={infos.email}
              onChange={e => setInfos({ ...infos, email: e.target.value })}
              className='w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500'
            />
          </div>

          <div>
            <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
              Téléphone
            </label>
            <input
              type='tel'
              value={infos.telephone}
              onChange={e => setInfos({ ...infos, telephone: e.target.value })}
              className='w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500'
            />
          </div>

          <div>
            <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
              Adresse
            </label>
            <input
              type='text'
              value={infos.adresse}
              onChange={e => setInfos({ ...infos, adresse: e.target.value })}
              className='w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500'
            />
          </div>

          {erreurEnregistrement && (
            <p className='text-sm text-red-500'>{erreurEnregistrement}</p>
          )}

          <button
            onClick={sauvegarder}
            disabled={enregistrement}
            className='px-8 py-3 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-colors shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {enregistrement ? 'Enregistrement...' : sauvegarde ? '✓ Sauvegardé' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </section>
  )
}
