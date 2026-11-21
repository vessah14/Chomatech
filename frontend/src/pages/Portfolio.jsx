import Badge from '../Components/ui/Badge'
import CardRealisation from '../Components/ui/CardRealisation'
import { motion } from 'framer-motion'
import Button from '../Components/ui/Button'
import { useLanguage } from '../context/LanguageContext'
import { useState, useEffect } from 'react'
import { getRealisations } from '../api/realisations'
import { resolveMediaUrl } from '../api/client'
import { X, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Portfolio () {
  const [realisations, setRealisations] = useState([])
  const [chargement, setChargement] = useState(true)
  const [activeFilter, setActiveFilter] = useState('Tout')
  const [realisationOuverte, setRealisationOuverte] = useState(null)

  useEffect(() => {
    let annule = false
    getRealisations()
      .then(data => {
        if (!annule) setRealisations(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  const realisationsFiltrees =
    activeFilter === 'Tout'
      ? realisations
      : realisations.filter(r => r.categorie === activeFilter)

  return (
    <>
      <Herosection />
      <FilterTabs onFilterChange={setActiveFilter} />
      <PortfolioSection
        realisations={realisationsFiltrees}
        chargement={chargement}
        onSelect={setRealisationOuverte}
      />
      <FinalCTASection />
      <BottomCTASection />

      {realisationOuverte && (
        <RealisationModal
          realisation={realisationOuverte}
          onClose={() => setRealisationOuverte(null)}
        />
      )}
    </>
  )
}

function RealisationModal ({ realisation, onClose }) {
  const { t } = useLanguage()
  const stack = realisation.technologies.split(',').map(tech => tech.trim())

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8'
      onClick={onClose}
    >
      <div
        className='w-full max-w-2xl max-h-full overflow-y-auto rounded-2xl bg-white shadow-xl'
        onClick={e => e.stopPropagation()}
      >
        <div className='relative'>
          <img
            alt={realisation.titre}
            src={
              resolveMediaUrl(realisation.image) ||
              'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=1160'
            }
            className='h-64 w-full object-cover'
          />
          <button
            onClick={onClose}
            className='absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-md transition hover:bg-white cursor-pointer'
          >
            <X size={18} />
          </button>
          <span className='absolute bottom-4 left-4 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-sky-400 shadow-md'>
            {t[realisation.categorie] || realisation.categorie}
          </span>
        </div>

        <div className='p-6 sm:p-8'>
          <h3 className='text-2xl font-extrabold text-gray-900'>{realisation.titre}</h3>

          <div className='mt-4 flex flex-wrap gap-2'>
            {stack.map(tech => (
              <Badge
                key={tech}
                className='bg-gray-100 text-gray-600 px-3 py-1 text-sm font-medium'
              >
                {tech}
              </Badge>
            ))}
          </div>

          {realisation.description && (
            <p className='mt-5 text-sm leading-relaxed text-gray-600'>
              {realisation.description}
            </p>
          )}

          {realisation.lien && (
            <a
              href={realisation.lien}
              target='_blank'
              rel='noopener noreferrer'
              className='mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-800 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg'
            >
              {t.visitProject || 'Voir le projet'}
              <ArrowUpRight size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function Herosection () {
  const { t } = useLanguage()

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className='business-page-hero flex flex-col items-center justify-center gap-8 px-4 py-10 sm:px-6 md:gap-12 md:py-16 lg:min-h-[420px] '
      >
        <div className='flex flex-col items-center'>
          <Badge
            children={t.servicesBadge}
            className='bg-sky-200 px-3 py-1 text-sky-500 font-bold'
          />
          <h1 className='max-w-[750px] text-center text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl'>
            {t.portfolioTitleBefore}{' '}
            <span className='text-sky-400'>{t.portfolioTitleHighlight}</span>
          </h1>
          <p className='mt-5 max-w-[700px] text-center text-sm text-gray-600 sm:text-base md:text-lg'>
            {t.portfolioDescription}
          </p>
        </div>
      </motion.section>
    </>
  )
}

const filters = [
  ['Tout', 'allMethods'],
  ['Site Vitrine', 'showcaseSite'],
  ['Application Web', 'webApplication'],
  ['Mobile', 'mobile'],
  ['ERP / Logiciel', 'erp'],
  ['Design', 'design'],
  ['E-commerce', 'ecommerce']
]

function FilterTabs ({ onFilterChange, className = '' }) {
  const { t } = useLanguage()
  const [activeFilter, setActiveFilter] = useState('Tout')

  function handleClick (filter) {
    setActiveFilter(filter)
    onFilterChange?.(filter)
  }

  return (
    <div
      className={`sticky top-[64px] z-40 border-b border-sky-400/30 bg-white/95 backdrop-blur-sm ${className}`}
    >
      <div className='mx-auto flex max-w-[1500px] flex-wrap gap-2 px-4 py-5 sm:gap-3'>
        {filters.map(([filter, translationKey]) => {
          const isActive = filter === activeFilter

          return (
            <button
              key={filter}
              onClick={() => handleClick(filter)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
              }`}
            >
              {t[translationKey]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PortfolioSection ({ realisations, chargement, onSelect }) {
  const { t } = useLanguage()

  return (
    <>
      <section className='mb-20 mt-20'>
        {chargement ? (
          <p className='text-center text-gray-400'>{t.loading || 'Chargement...'}</p>
        ) : realisations.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className='mx-auto mt-10 grid max-w-[1500px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
          >
            {realisations.map(realisation => (
              <CardRealisation
                key={realisation.id}
                image={resolveMediaUrl(realisation.image)}
                title={realisation.titre}
                stack={realisation.technologies.split(',').map(tech => tech.trim())}
                badge={realisation.categorie}
                lien={realisation.lien}
                onViewDetails={() => onSelect(realisation)}
              />
            ))}
          </motion.div>
        ) : (
          <p className='text-center text-gray-400'>{t.noRealisations || 'Aucune réalisation pour le moment.'}</p>
        )}
      </section>
    </>
  )
}

function FinalCTASection () {
  const { t } = useLanguage()
  const navigate = useNavigate()
  return (
    <section className='bg-sky-100'>
      <div className='flex flex-col items-center justify-center py-20'>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className='w-full max-w-[700px] px-4 text-center'
        >
          <h2 className='mb-5 mt-14 text-4xl font-extrabold text-gray-800 md:text-5xl'>
            {t.finalSuccessBefore}{' '}
            <span className='text-sky-400'>{t.finalSuccessHighlight}</span>
          </h2>
          <p className='text-base font-medium text-gray-600 sm:text-lg'>
            {t.finalSuccessText}
          </p>
        </motion.div>
        <div className=' flex flex-col gap-4 sm:flex-row'>
          <Button
            onClick={() => navigate('/contact')}
            children={t.start}
            icon={' →'}
            className='bg-gradient-to-r from-sky-600 to-sky-800 text-white font-semibold'
          />
        </div>
      </div>
    </section>
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
          <h2 className='mb-5 mt-5 text-4xl font-extrabold text-white md:text-5xl'>
            {t.readyToTransform}
          </h2>
          <p className='text-base font-medium text-gray-200 sm:text-lg'>
            {t.trustedCompanies}
          </p>
        </motion.div>

        <div className='mt-10 flex flex-col justify-center gap-4 sm:flex-row'>
          <Button
            onClick={() => navigate('/contact')}
            children={t.talkToExpert}
            icon={' →'}
            className='bg-white text-(--btn-color) font-semibold'
          />
          <Button
            onClick={() => navigate('/services')}
            children={t.servicesLabel}
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
