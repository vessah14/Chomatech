import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { serviceProcess } from '../data/services'
import { getService, getServices, createDemandeService } from '../api/services'
import { formatPrixFcfa } from '../utils/format'

export default function ServiceDetail () {
  const { id } = useParams()
  const { t } = useLanguage()

  const [service, setService] = useState(null)
  const [loadedId, setLoadedId] = useState(null)
  const [autresServices, setAutresServices] = useState([])
  const chargement = loadedId !== id
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [envoiDemande, setEnvoiDemande] = useState(false)
  const [erreurDemande, setErreurDemande] = useState('')

  // Crée une vraie demande de service (suivie ensuite dans "Mes services" et côté admin) ;
  // auparavant ce bouton renvoyait simplement vers le formulaire de contact.
  const demanderService = async () => {
    if (!isAuthenticated) {
      navigate('/authentification', { state: { from: `/Services/${id}` } })
      return
    }

    setEnvoiDemande(true)
    setErreurDemande('')
    try {
      await createDemandeService(id)
      navigate('/admin/services')
    } catch (err) {
      setErreurDemande(err.message)
    } finally {
      setEnvoiDemande(false)
    }
  }

  useEffect(() => {
    let annule = false
    getService(id)
      .then(data => {
        if (annule) return
        setService(data)
        setLoadedId(id)
      })
      .catch(() => {
        if (annule) return
        setService(null)
        setLoadedId(id)
      })

    // Chargé séparément : un échec ici ne doit pas faire afficher "service introuvable"
    // alors que le service lui-même a bien été chargé.
    getServices()
      .then(all => {
        if (annule) return
        setAutresServices(all.filter(s => s.id !== id && s.statut === 'Actif').slice(0, 3))
      })
      .catch(() => {})
    return () => {
      annule = true
    }
  }, [id])

  if (chargement) {
    return (
      <div className='max-w-3xl mx-auto px-4 py-20 text-center text-gray-400'>
        {t.loading}
      </div>
    )
  }

  if (!service) {
    return (
      <div className='max-w-3xl mx-auto px-4 py-20 text-center'>
        <h1 className='text-2xl font-bold text-gray-900'>
          {t.serviceNotFound}
        </h1>
        <Link to='/' className='mt-4 inline-block text-sky-600 font-medium'>
          ← {t.backHome}
        </Link>
      </div>
    )
  }

  return (
    <section className='max-w-[1500px] mx-auto px-4 py-20'>
      <Link
        to='/'
        className='text-sky-600 font-medium inline-flex items-center gap-1 mb-8'
      >
        ← {t.backHome}
      </Link>

      <div className='max-w-2xl'>
        <span className='inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-600'>
          {service.categorie}
        </span>

        <h1 className='mt-4 text-3xl font-bold text-gray-900'>
          {service.nomService}
        </h1>

        {service.description && (
          <p className='mt-4 text-lg text-gray-600 leading-relaxed'>
            {service.description}
          </p>
        )}

        <span className='mt-4 inline-block rounded-lg text-xl text-sky-400 font-medium'>
          {service.montant === null ? t.onQuote : formatPrixFcfa(service.montant)}
        </span>

        <div className='mt-6 flex flex-wrap gap-4'>
          <button
            type='button'
            onClick={demanderService}
            disabled={envoiDemande}
            className='inline-block rounded-lg bg-sky-600 px-6 py-3 text-white font-semibold hover:bg-sky-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer'
          >
            {envoiDemande ? t.sending : t.requestQuote}
          </button>
          <Link
            to='/contact'
            className='inline-block rounded-lg border border-sky-600 px-6 py-3 text-sky-600 font-semibold hover:bg-sky-50 transition-colors'
          >
            {t.contactUs}
          </Link>
        </div>
        {erreurDemande && <p className='mt-3 text-sm text-red-500'>{erreurDemande}</p>}
      </div>

      <div className='mt-10 flex flex-col gap-6 md:flex-row md:gap-10'>
        <div className='flex flex-col bg-sky-200/30 px-5 py-3 border border-sky-400/70 rounded-2xl justify-center'>
          <div className='flex items-center gap-3 mb-4'>
            <span className='text-xl bg-sky-100 p-1 rounded-lg'>🎯</span>
            <h3 className='text-lg font-bold text-gray-900'>{t.challenge}</h3>
          </div>
          <p className='text-gray-500 text-sm leading-relaxed'>{t.challengeDescription}</p>
        </div>

        <div className='flex flex-col bg-sky-200/30 px-5 py-3 border border-sky-400/70 rounded-2xl justify-center'>
          <div className='flex items-center gap-3 mb-4'>
            <span className='text-xl bg-sky-100 p-1 rounded-lg'>💡</span>
            <h3 className='text-lg font-bold text-gray-900'>{t.solution}</h3>
          </div>
          <p className='text-gray-500 text-sm leading-relaxed'>{t.solutionDescription}</p>
        </div>
      </div>

      <div className='mt-20'>
        <h2 className='text-2xl font-bold text-gray-900'>{t.processTitle}</h2>
        <div className='mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {serviceProcess.map(etape => (
            <div
              key={etape.number}
              className='bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-300'
            >
              <span className='text-xl font-bold px-4 py-2 bg-sky-500 text-white rounded-lg'>
                {etape.number}
              </span>
              <h3 className='text-base font-bold text-gray-900 mt-3'>
                {t[etape.title]}
              </h3>
              <p className='text-gray-500 text-sm leading-relaxed'>
                {t[etape.description]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {autresServices.length > 0 && (
        <div className='mt-20'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            {t.otherServices}
          </h2>
          <div className='space-y-4 p-4 flex flex-col md:flex-row md:space-y-0 md:space-x-4'>
            {autresServices.map(item => (
              <Link
                key={item.id}
                to={`/Services/${item.id}`}
                className='flex-1 bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-300'
              >
                <span className='inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-600'>
                  {item.categorie}
                </span>
                <h3 className='font-bold text-gray-900 text-base mt-3 mb-2'>
                  {item.nomService}
                </h3>
                <p className='text-gray-500 text-sm leading-relaxed line-clamp-2'>
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
