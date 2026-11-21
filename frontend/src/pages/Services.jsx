import Badge from '../Components/ui/Badge'
import Button from '../Components/ui/Button'
import Cards from '../Components/ui/Cards'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { serviceProcess } from '../data/services'
import { getServices } from '../api/services'
import { formatPrixFcfa } from '../utils/format'
import { ArrowUpRight, Cpu, MonitorCog, ShieldCheck } from 'lucide-react'

export default function Services () {
  return (
    <>
      <Herosection />
      <Sectionservices />
      <Sectionfonctionement />
      <FinalCTASection />
      <BottomCTASection />
    </>
  )
}

function Herosection () {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className='services-hero business-page-hero px-4 py-12 sm:px-6 md:py-16 lg:py-20'
      >
        <div className='services-hero__content mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16'>
          <div className='services-hero__copy'>
          <Badge
            children={t.servicesBadge}
            className='services-hero__badge bg-sky-200 px-3 py-1 font-bold text-sky-500'
          />
          <h1 className='mt-5 max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-[3.4rem]'>
            {t.servicesTitleBefore}{' '}
            <span className='text-sky-400'>{t.servicesTitleHighlight}</span>{' '}
            {t.servicesTitleAfter}
          </h1>
          <p className='mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8'>
            {t.servicesDescription}
          </p>
        <Button
          onClick={() => navigate('/contact')}
          children={t.requestQuote}
          icon={' →'}
          className='services-hero__button mt-7 font-semibold'
        />
          </div>
          <div className='services-hero__visual' aria-hidden='true'>
            {[
              { icon: MonitorCog, title: t.servicesLabel, number: '01' },
              { icon: Cpu, title: t.shop, number: '02' },
              { icon: ShieldCheck, title: t.whyUs, number: '03' }
            ].map(({ icon: Icon, title, number }) => (
              <div className='services-hero__tile' key={number}>
                <span className='services-hero__tile-icon'><Icon size={21} strokeWidth={1.8} /></span>
                <span className='services-hero__tile-title'>{title}</span>
                <span className='services-hero__tile-number'>{number}</span>
                <ArrowUpRight className='services-hero__tile-arrow' size={17} />
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </>
  )
}

function Sectionservices () {
  const { t } = useLanguage()
  const [services, setServices] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false
    getServices()
      .then(data => {
        if (!annule) setServices(data.filter(s => s.statut === 'Actif'))
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

  if (chargement) {
    return <p className='text-center text-gray-400 py-20'>{t.loading}</p>
  }

  if (erreur) {
    return <p className='text-center text-red-500 py-20'>{erreur}</p>
  }

  return (
    <section className='services-catalog-section px-4 py-14 sm:px-6 sm:py-18 lg:px-8'>
      <div className='mx-auto mb-8 max-w-7xl'>
        <span className='services-section-kicker'>{t.servicesBadge}</span>
        <h2 className='mt-4 text-3xl font-bold text-slate-900 sm:text-4xl'>{t.servicesLabel}</h2>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className='services-catalog-grid mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 pb-6 sm:grid-cols-2 lg:grid-cols-3'
      >
        {services.map(service => (
          <Link
            key={service.id}
            to={`/Services/${service.id}`}
            className='service-catalog-card business-service-card group flex flex-col rounded-2xl border border-sky-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100 sm:p-7'
          >
            <div className='service-catalog-card__top flex items-center justify-between gap-3'>
              <span className='service-catalog-card__icon flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600'>
                <MonitorCog size={21} strokeWidth={1.8} />
              </span>
              <span className='inline-block w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-600'>
                {service.categorie}
              </span>
            </div>
            <h3 className='mt-5 text-lg font-bold text-gray-900 sm:text-xl'>
              {service.nomService}
            </h3>
            {service.description && (
              <p className='mt-2 line-clamp-3 text-sm leading-6 text-gray-500'>
                {service.description}
              </p>
            )}
            <div className='service-catalog-card__footer mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-5'>
              <span className='text-sm font-bold text-slate-800'>
                {service.montant === null ? t.onQuote : formatPrixFcfa(service.montant)}
              </span>
              <ArrowUpRight className='text-sky-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5' size={18} aria-hidden='true' />
            </div>
          </Link>
        ))}

        {services.length === 0 && (
          <p className='col-span-full text-center text-gray-400'>
            {t.noProducts}
          </p>
        )}
      </motion.div>
    </section>
  )
}

function Sectionfonctionement () {
  const { t } = useLanguage()

  return (
    <>
      <section className='services-process-section px-4 py-16 sm:px-6 sm:py-20 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='flex flex-col items-center'>
            <Badge
              children={t.process}
              className='bg-sky-200 px-3 py-1 text-sky-500 font-bold'
            />
            <h2 className='mt-4 max-w-[700px] text-center text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl'>
              {t.processTitleBefore}{' '}
              <span className='text-sky-400'>{t.processTitleHighlight}</span>
            </h2>
            <p className='mt-3 max-w-[700px] text-center text-base leading-7 text-slate-600 sm:text-lg'>
              {t.processText}
            </p>
          </div>
          <div className='services-process-grid mx-auto mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            {serviceProcess.map((service, index) => (
              <Cards
                key={index}
                className='service-step-card mx-auto w-full max-w-none'
                className2={index === 0 ? 'text-4xl' : ''}
                tittle={service.title}
                Description={service.description}
                icon={String(service.number).padStart(2, '0')}
                className3='text-3xl font-bold text-sky-500'
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function FinalCTASection () {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <section className='services-final-cta bg-sky-700'>
      <div className='flex flex-col items-center justify-center py-16 md:py-20'>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className='w-full max-w-[700px] px-4 text-center'
        >
          <span className='text-4xl animate-float absolute '>🚀</span>
          <h2 className='services-final-cta__title mb-5 mt-14 text-4xl font-extrabold md:text-5xl'>
            {t.bestForProjectBefore}{' '}
            <span className='text-sky-400'>{t.bestForProjectHighlight}</span>
          </h2>
          <p className='services-final-cta__description text-base font-medium sm:text-lg'>
            {t.initialConsultation}
          </p>
        </motion.div>
        <div className='mt-10 flex flex-col gap-4 sm:flex-row'>
          <Button
            onClick={() => navigate('/contact')}
            children={t.start}
            icon={' →'}
            className='services-final-cta__button font-semibold'
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
    <section className='services-bottom-cta flex flex-col items-center justify-center bg-sky-800 px-4 text-center'>
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
            className='services-bottom-cta__primary font-semibold'
          />
          <Button
            onClick={() => navigate('/services')}
            children={t.servicesLabel}
            className='services-bottom-cta__secondary font-semibold'
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
