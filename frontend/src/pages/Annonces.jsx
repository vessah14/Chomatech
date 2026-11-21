import Badge from '../Components/ui/Badge'
import { motion } from 'framer-motion'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import Button from '../Components/ui/Button'
import { Pin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAnnonces, incrementerVuesAnnonce } from '../api/annonces'
import { inscrireNewsletter } from '../api/newsletter'

export default function AnnoncesPage () {
  const [activeFilter, setActiveFilter] = useState('Tout')
  const [annonces, setAnnonces] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false
    getAnnonces()
      .then(data => {
        if (!annule) setAnnonces(data.filter(a => a.statut === 'Publiée'))
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

  return (
    <>
      <HeroSection />
      <FilterTabs
        annonces={annonces}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      <AnnouncementsSection
        annonces={annonces}
        chargement={chargement}
        erreur={erreur}
        activeFilter={activeFilter}
      />
      <NewsletterSection />
      <BottomCTASection />
    </>
  )
}

// Incrémente le compteur de vues une seule fois par annonce affichée (impression),
// même si React (StrictMode) monte le composant deux fois en dev.
function useVueImpression (id) {
  const dejaCompte = useRef(false)
  useEffect(() => {
    if (dejaCompte.current) return
    dejaCompte.current = true
    incrementerVuesAnnonce(id).catch(() => {})
  }, [id])
}

function HeroSection () {
  const { t } = useLanguage()

  return (
    <div
      className='business-page-hero relative py-10'
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8'
      >
        <div>
          <Badge
            children={t.announcementsBadge}
            className='bg-sky-500 border border-sky-400 text-white mb-4 px-2'
          />
          <h1 className='max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl text-gray-900'>
            {t.announcementsTitleBefore}{' '}
            <span className='text-sky-400'>
              {t.announcementsTitleHighlight}
            </span>{' '}
            {t.announcementsTitleAfter}
          </h1>
          <p className='mt-4 text-sm md:text-xl text-gray-600 max-w-2xl'>
            {t.announcementsDescription}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

function FilterTabs ({ annonces, activeFilter, onFilterChange, className = '' }) {
  const { t } = useLanguage()
  const categories = useMemo(
    () => ['Tout', ...new Set(annonces.map(a => a.categorie))],
    [annonces]
  )

  return (
    <div
      className={`sticky top-[64px] z-40 border-b border-sky-400/30 bg-white/95 backdrop-blur-sm ${className}`}
    >
      <div className='mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 overflow-x-auto px-4 py-4 sm:gap-3 sm:px-6 lg:px-8'>
        {categories.map(categorie => {
          const isActive = categorie === activeFilter

          return (
            <button
              key={categorie}
              type='button'
              onClick={() => onFilterChange(categorie)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition sm:px-5 ${
                isActive
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
              }`}
            >
              {categorie === 'Tout' ? t.all : categorie}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AnnonceCard ({ annonce, mettreEnAvant }) {
  const { t } = useLanguage()
  useVueImpression(annonce.id)

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-6 ${
        mettreEnAvant ? 'ring-1 ring-sky-200' : ''
      }`}
    >
      <div className='flex items-center justify-between gap-2 mb-3'>
        <span className='text-xs font-semibold text-sky-600 bg-sky-100 px-3 py-1 rounded-full'>
          {annonce.categorie}
        </span>
        {annonce.epingle && (
          <span className='flex items-center gap-1 text-xs font-semibold text-amber-600'>
            <Pin className='w-3 h-3' fill='currentColor' />
            {t.pinned}
          </span>
        )}
      </div>

      <h3 className='font-bold text-gray-900 text-lg mb-2'>{annonce.titre}</h3>

      <p className='text-xs text-gray-400'>
        {new Date(annonce.createdAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}
      </p>
    </div>
  )
}

function AnnouncementsSection ({ annonces, chargement, erreur, activeFilter }) {
  const { t } = useLanguage()

  const filtrees = useMemo(
    () =>
      activeFilter === 'Tout'
        ? annonces
        : annonces.filter(a => a.categorie === activeFilter),
    [annonces, activeFilter]
  )

  const epinglees = filtrees.filter(a => a.epingle)
  const autres = filtrees.filter(a => !a.epingle)

  if (chargement) {
    return (
      <div className='min-h-screen bg-sky-50 py-10 px-4 text-center text-gray-400'>
        {t.loading}
      </div>
    )
  }

  if (erreur) {
    return (
      <div className='min-h-screen bg-sky-50 py-10 px-4 text-center text-red-500'>
        {erreur}
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-sky-50 py-10 px-4'>
      <div className='max-w-7xl mx-auto'>
        {epinglees.length > 0 && (
          <>
            <h1 className='flex items-center gap-2 text-2xl font-extrabold text-gray-900 mb-6'>
              <Pin className='w-5 h-5 text-sky-500' fill='currentColor' />
              {t.pinned}
            </h1>

            <div className='grid md:grid-cols-2 gap-6 mb-10'>
              {epinglees.map(annonce => (
                <AnnonceCard key={annonce.id} annonce={annonce} mettreEnAvant />
              ))}
            </div>
          </>
        )}

        <h2 className='text-lg font-bold text-gray-900 mb-4'>
          {t.allAnnouncements}
        </h2>

        {autres.length > 0 ? (
          <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {autres.map(annonce => (
              <AnnonceCard key={annonce.id} annonce={annonce} />
            ))}
          </div>
        ) : (
          <p className='text-gray-400 text-sm'>{t.noAnnouncements}</p>
        )}
      </div>
    </div>
  )
}

function NewsletterSection () {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [erreur, setErreur] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setErreur(t.invalidEmail)
      setStatus('error')
      return
    }

    setStatus('loading')
    try {
      await inscrireNewsletter(email.trim())
      setStatus('success')
      setEmail('')
    } catch (err) {
      setErreur(err.message)
      setStatus('error')
    }
  }

  return (
      <div className='bg-gradient-to-b from-sky-50 to-sky-100 py-16 px-4'>
      <div className='max-w-2xl mx-auto text-center'>
        <h2 className='text-3xl font-extrabold text-gray-900 mb-3'>
          {t.newsletterTitle}
        </h2>
        <p className='text-gray-500 mb-8'>{t.newsletterDescription}</p>

        <form
          onSubmit={handleSubmit}
          className='flex items-center justify-center gap-3 max-w-md mx-auto'
        >
          <input
            type='email'
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              if (status !== 'idle') setStatus('idle')
            }}
            placeholder={t.emailPlaceholder}
            className='flex-1 bg-white border border-sky-100 rounded-full px-5 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300 transition-shadow'
          />
          <button
            type='submit'
            disabled={status === 'loading'}
            className='bg-sky-500 hover:bg-sky-600 transition-colors text-white font-semibold text-sm px-6 py-3 rounded-full whitespace-nowrap shrink-0 disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {t.subscribe}
          </button>
        </form>

        {status === 'success' && (
          <p className='text-sm text-green-600 mt-3'>{t.newsletterSuccess}</p>
        )}
        {status === 'error' && (
          <p className='text-sm text-rose-500 mt-3'>{erreur}</p>
        )}
      </div>
    </div>
  )
}

function BottomCTASection () {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <section className='flex flex-col items-center justify-center bg-sky-800 px-4 text-center'>
      <div className='py-20'>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className='flex w-full max-w-[900px] flex-col items-center justify-center text-center'
        >
          <div className='mb-3 flex max-w-[320px] items-center gap-3 rounded-full bg-white px-4 py-2 ring-1 ring-sky-400'>
            <LiveDot />
            <p className='text-xs font-bold text-[var(--btn-color)]'>
              {t.talkProject}
            </p>
          </div>
          <h2 className='mt-5 mb-5 text-4xl font-extrabold text-white md:text-4xl'>
            {t.readyBefore}{' '}
            <span className='text-sky-400'>{t.readyHighlight}</span>
          </h2>
          <p className='text-lg font-medium text-gray-200'>
            {t.trustedCompanies}
          </p>
        </motion.div>

        <div className='mt-10 flex flex-col justify-center gap-4 sm:flex-row'>
          <Button
            children={t.talkToExpert}
            icon={'  →'}
            onClick={() => navigate('/contact')}
            className='bg-white text-sky-700 font-semibold'
          />
          <Button
            children={t.servicesLabel}
            onClick={() => navigate('/services')}
            className='border-2 border-white bg-white/10 font-semibold text-white'
          />
        </div>
      </div>
    </section>
  )
}

function LiveDot () {
  return (
    <span className='relative flex h-4 w-4  items-center justify-center'>
      <span className='animate-ping [animation-delay:1s] absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75'></span>
      <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400'></span>
    </span>
  )
}
