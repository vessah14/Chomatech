import '../App.css'
import Badge from '../Components/ui/Badge'
import Button from '../Components/ui/Button'
import CardsProduct from '../Components/ui/CardProduct'
import CardRealisation from '../Components/ui/CardRealisation'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Star, ArrowUpRight, Cpu, MonitorCog, ShieldCheck } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { MoveRight, Check } from 'lucide-react'
import Faq from '../Components/ui/Faq'
import { useLanguage } from '../context/LanguageContext'
import { useNavigate, Link } from 'react-router-dom'
import { getProduits } from '../api/produits'
import { getServices } from '../api/services'
import { getRealisations } from '../api/realisations'
import { getAnnonces } from '../api/annonces'
import { getAvisPublies } from '../api/avis'
import { resolveMediaUrl } from '../api/client'
import heroImage from '../assets/image1.png'

const badges = [
  {
    children: 'Sites web',
    className: 'bg-white text-[var(--btn-color)] font-medium px-3 py-1.5',
    icon: '🖥️'
  },
  {
    children: 'IA & Automation',
    className: 'bg-white text-[var(--btn-color)] font-medium px-3 py-1.5',
    icon: '🤖'
  },
  {
    children: 'Solutions Digitales',
    className: 'bg-white text-[var(--btn-color)] font-medium px-3 py-1.5',
    icon: '⚙️'
  },
  {
    children: 'Design & UX',
    className: 'bg-white text-[var(--btn-color)] font-medium px-3 py-1.5 ',
    icon: '🎨'
  },
  {
    children: 'Conseil',
    className: 'bg-white text-[var(--btn-color)] font-medium px-3 py-1.5',
    icon: '📊'
  },
  {
    children: 'Audit',
    className: 'bg-white text-[var(--btn-color)] font-medium px-3 py-1.5',
    icon: '🔍'
  }
]

const Lettres = ['M', 'J', 'F', 'A', 'k']

export default function Home () {
  return (
    <>
      <HeroSection />
      <BusinessPillars />
      <ServicesSection />
      <StatsSection />
      <ProductsSection />
      <PortfolioSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <FaqSection />
      <NewsSection />
      <FinalCTASection />
      <BottomCTASection />
    </>
  )
}

function HeroSection () {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <section className='home-hero relative flex flex-col items-center justify-center gap-8 overflow-hidden px-4 py-12 sm:px-6 md:gap-12 md:py-16 lg:min-h-[680px]'>
      <div className='home-motion-orbit home-motion-orbit--large' aria-hidden='true' />
      <div className='home-motion-orbit home-motion-orbit--small' aria-hidden='true' />
      <div className='home-motion-beam' aria-hidden='true' />
      <div className='relative z-10 flex w-full max-w-[1400px] flex-col items-center justify-center gap-8 lg:flex-row lg:items-center lg:justify-between'>
        {/* Bloc texte — arrive de la GAUCHE */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
          className='home-hero-copy relative z-10 w-full max-w-[700px]'
        >
          <div className='home-eyebrow mb-6 flex max-w-fit items-center gap-3 rounded-full px-4 py-2'>
            <LiveDot />
            <p className='text-xs font-bold tracking-wide text-sky-100'>
              CHOMA TECH · {t.transformation}
            </p>
          </div>

          <h1 className='mb-4 max-w-[780px] text-3xl font-bold leading-tight tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl'>
            {t.homeTitleBefore}{' '}
            <span className='text-sky-300'>{t.homeTitleHighlight}</span>
          </h1>

          <p className='mt-6 max-w-[590px] text-base leading-7 text-slate-300 sm:text-lg lg:text-[1.1rem]'>
            {t.footerDescription}
          </p>

          <div className='mt-8 flex flex-col gap-4 sm:flex-row sm:gap-6'>
            <Button
              onClick={() => navigate('/services')}
              className='flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-950/30 transition hover:-translate-y-0.5 hover:bg-sky-700 sm:w-auto'
            >
              {t.discoverServices}
              <MoveRight />
            </Button>

            <Button
              onClick={() => navigate('/contact')}
              className='flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 sm:w-auto'
            >
              {t.talkToExpert}
            </Button>
          </div>

          <div className='mt-10 flex flex-wrap items-center gap-6'>
            <div className='flex'>
              {Lettres.map((lettre, index) => (
                <span
                  key={index}
                  className='flex h-9 w-9 -ml-3 items-center justify-center rounded-full border-2 border-[#17243e] bg-slate-600 text-xs font-semibold text-white first:ml-0'
                  style={{ zIndex: Lettres.length - index }}
                >
                  {lettre}
                </span>
              ))}
            </div>
            <div className='flex flex-col'>
              <div className='flex items-center gap-1 text-amber-400'>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} fill='currentColor' />)}</div>
              <p className='text-xs text-slate-300'>
                <span className='font-semibold text-white'>120+ clients</span>{' '}
                nous font confiance
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bloc image — arrive de la DROITE */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.25, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className='home-hero-visual hidden w-full max-w-[650px] items-center justify-center sm:flex lg:min-h-[500px]'
        >
          <div className='relative w-full max-w-[680px]'>
            <div className='relative z-10 w-[90%] max-w-[700px]'>
              <div className='home-hero-image overflow-hidden rounded-[1.6rem] border border-white/15 bg-white/5 p-2 shadow-2xl backdrop-blur'>
                <img
                  src={heroImage}
                  alt='Présentation du projet'
                  className='h-[300px] w-full rounded-[1.1rem] object-cover sm:h-[370px] lg:h-[430px]'
                />
              </div>
            </div>

            <div className='animate-float absolute left-0 top-4 z-20 flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-3 shadow-xl backdrop-blur-md'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-300 to-sky-500 shadow-lg shadow-sky-200'>
                <Check className='h-6 w-6 text-white' strokeWidth={3} />
              </div>
              <div>
                <p className='text-sm font-semibold text-gray-800'>
                  {t.projectDelivered}
                </p>
                <p className='text-xs text-gray-500'>Site AfroPay · 3 sem.</p>
              </div>
            </div>

            <div className='animate-float-slow absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-2xl bg-white/90 px-4 py-4 shadow-xl backdrop-blur-md'>
              <div className='flex flex-col items-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-2xl'>
                  🤖
                </div>
                <p className='mt-2 text-xs font-semibold text-gray-600'>
                  {t.activeAi}
                </p>
              </div>
            </div>

            <div className='animate-float-rotate absolute bottom-5 right-6 z-20 flex items-center gap-3 rounded-2xl bg-white/90 px-5 py-4 shadow-xl backdrop-blur-md'>
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-xl'>
                🚀
              </div>
              <div>
                <p className='text-lg font-bold text-gray-800'>
                  +340% conversions
                </p>
                <p className='text-xs text-gray-500'>{t.clientResult}</p>
              </div>
            </div>

            <div className='absolute right-16 top-20 h-4 w-4 rounded-full bg-white/70 animate-float-slow'></div>
            <div className='absolute bottom-24 left-8 h-6 w-6 rounded-full bg-white/60 animate-float'></div>
            <div className='absolute left-16 top-1/2 h-3 w-3 rounded-full bg-[var(--btn-color)]/40 animate-float-rotate'></div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9 }}
        className='badges-row mt-4 flex w-full flex-wrap items-center justify-center gap-2.5 px-2'
      >
        {badges.map((badge, index) => (
          <Badge
            key={index}
            className={`flex items-center ${badge.className ?? ''}`}
          >
            <span className='text-lg mr-2'>{badge.icon}</span>
            {badge.children}
          </Badge>
        ))}
      </motion.div>
    </section>
  )
}

function BusinessPillars () {
  const { t } = useLanguage()
  const pillars = [
    { icon: MonitorCog, eyebrow: '01 / SERVICES', title: t.servicesLabel, body: t.serviceTagline, to: '/services' },
    { icon: Cpu, eyebrow: '02 / ÉQUIPEMENTS', title: t.shop, body: t.productsDescription, to: '/produits' },
    { icon: ShieldCheck, eyebrow: '03 / ACCOMPAGNEMENT', title: t.whyUs, body: t.whyUsText, to: '/about' }
  ]

  return (
    <section className='business-pillars mx-auto grid max-w-[1420px] gap-4 px-4 py-7 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:py-10'>
      {pillars.map(({ icon: Icon, eyebrow, title, body, to }) => (
        <Link key={eyebrow} to={to} className='pillar-card group flex min-h-36 items-start gap-4 rounded-2xl border p-5 transition duration-300 hover:-translate-y-1 sm:p-6'>
          <span className='pillar-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl'><Icon size={21} strokeWidth={1.8} /></span>
          <span className='min-w-0'>
            <span className='block text-[10px] font-bold tracking-[0.16em] text-slate-400'>{eyebrow}</span>
            <span className='mt-1 block text-lg font-semibold tracking-tight text-slate-900'>{title}</span>
            <span className='mt-1 line-clamp-2 block text-sm leading-5 text-slate-500'>{body}</span>
          </span>
          <ArrowUpRight className='ml-auto mt-1 shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-sky-600' size={17} />
        </Link>
      ))}
    </section>
  )
}

function ServicesSection () {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [services, setServices] = useState([])

  useEffect(() => {
    let annule = false
    getServices()
      .then(data => {
        if (!annule) setServices(data.filter(s => s.statut === 'Actif').slice(0, 6))
      })
      .catch(() => {})
    return () => {
      annule = true
    }
  }, [])

  return (
    <section className='flex flex-col items-center justify-center px-4'>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className='mx-auto mt-20 flex max-w-[800px] flex-col items-center justify-center gap-5 text-center'
      >
        <Badge className='bg-sky-100 px-3 py-1 text-[var(--btn-color)] font-bold'>
          {t.expertise}
        </Badge>
        <h2 className='text-3xl font-extrabold md:text-5xl'>
          {t.servicesTitleBefore}{' '}
          <span className='text-sky-400'>{t.servicesTitleHighlight}</span>{' '}
          {t.servicesTitleAfter}
        </h2>
        <p className='text-base text-gray-600 md:text-lg'>{t.serviceTagline}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className='mx-auto mt-10 grid w-full max-w-[1500px] grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3'
      >
        {services.map(service => (
          <Link
            key={service.id}
            to={`/Services/${service.id}`}
          className='home-service-card mx-auto mt-10 flex w-full max-w-[450px] flex-col rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100'
          >
            <span className='inline-block w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-600'>
              {service.categorie}
            </span>
            <h3 className='mt-4 text-2xl font-bold text-gray-900'>
              {service.nomService}
            </h3>
            {service.description && (
              <p className='mt-2 line-clamp-3 text-lg/relaxed text-gray-500'>
                {service.description}
              </p>
            )}
            <span className='mt-4 inline-flex items-center gap-1 font-medium text-sky-600'>
              {t.discover} →
            </span>
          </Link>
        ))}
      </motion.div>
      <Button
        children={t.servicesLabel}
        icon={'→'}
        onClick={() => navigate('/services')}
        className='mt-7 w-full max-w-[300px] cursor-pointer bg-gradient-to-r from-sky-600 to-sky-800 text-white font-semibold sm:w-auto'
      />
    </section>
  )
}

function StatsSection () {
  const { t } = useLanguage()

  const stats = [
    { value: 120, suffix: '+', label: t.satisfiedClients },
    { value: 5, suffix: ' ans', label: t.digitalExpertise },
    { value: 240, suffix: '+', label: t.deliveredProjects },
    { value: 98, suffix: '%', label: t.satisfactionRate }
  ]

  return (
    <section className='home-stats mt-10 px-4'>
      <div className='mx-auto flex max-w-[1200px] flex-col items-center justify-center gap-5 py-20 text-center text-white'>
        <h2 className='text-3xl font-extrabold text-white md:text-5xl'>{t.results}</h2>
        <p className='mb-10 text-base text-slate-200 md:text-lg'>{t.figures}</p>
        <div className='grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {stats.map((stat, index) => (
            <div key={index}>
              <h2 className='text-3xl font-extrabold text-white md:text-5xl'>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </h2>
              <p className='mt-2 text-lg'>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AnimatedCounter ({ value, suffix = '', duration = 1400 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return

    let animationFrameId = null
    const startTime = performance.now()

    const tick = timestamp => {
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextValue = Math.round(value * eased)
      setCount(nextValue)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick)
      }
    }

    animationFrameId = requestAnimationFrame(tick)

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [duration, isInView, value])

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  )
}

function ProductsSection () {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [produits, setProduits] = useState([])

  useEffect(() => {
    let annule = false
    getProduits()
      .then(data => {
        if (!annule) setProduits(data.filter(p => p.statut !== 'Archivé').slice(0, 4))
      })
      .catch(() => {})
    return () => {
      annule = true
    }
  }, [])

  return (
    <section className='home-tinted-section px-4 py-20'>
      <div className='mx-auto flex max-w-[1500px] flex-col gap-5'>
        <div>
          <Badge
            children={'Boutique Tech'}
            className='flex items-center justify-center bg-sky-200 px-2 text-sky-600 font-bold'
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className='flex flex-col justify-between gap-6 md:flex-row md:items-center'
        >
          <h2 className='text-center text-3xl font-extrabold sm:text-4xl md:text-5xl'>
            {t.productsTitleBefore}{' '}
            <span className='text-sky-400'>{t.productsTitleHighlight}</span>
          </h2>
          <Button
            onClick={() => navigate('/produits')}
            children={t.seeAll}
            icon={'→'}
            className='w-full rounded-xl border border-sky-300 bg-white px-5 py-3 text-base font-semibold text-sky-700 shadow-sm transition hover:border-sky-500 hover:bg-sky-50 hover:text-sky-800 md:w-auto'
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className='mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        >
          {produits.map(produit => (
            <CardsProduct
              key={produit.id}
              type={produit.categorie}
              statut={produit.statut}
              tittle={produit.nomProduit}
              price={produit.montant}
              image={produit.image}
              id={produit.id}
              stock={produit.stock}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function PortfolioSection () {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [realisations, setRealisations] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    let annule = false
    getRealisations()
      .then(data => {
        if (!annule) setRealisations(data.slice(0, 3))
      })
      .catch(() => {})
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  if (!chargement && realisations.length === 0) return null

  return (
    <section className='px-4 py-20'>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9 }}
        className='mx-auto flex max-w-[1500px] flex-col items-center justify-center gap-5 text-center'
      >
        <h2 className='text-3xl font-extrabold md:text-5xl'>
          {t.portfolioTitleBefore}{' '}
          <span className='text-sky-400'>{t.portfolioTitleHighlight}</span>
        </h2>
        <p className='max-w-[700px] text-base text-gray-600 md:text-lg'>
          {t.achievementsDescription}
        </p>
      </motion.div>
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
            onViewDetails={() => navigate('/portfolio')}
          />
        ))}
      </motion.div>
      <div className='mt-10 flex items-center justify-center'>
        <Button
          onClick={() => navigate('/portfolio')}
          children={t.seeAllAchievements}
          icon={' →'}
          className='mt-10 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-300 bg-white px-5 py-3 text-base font-semibold text-sky-700 shadow-sm transition hover:border-sky-500 hover:bg-sky-600 hover:text-white md:w-auto'
        />
      </div>
    </section>
  )
}

function WhyChooseUsSection () {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <section className='home-tinted-section px-4 py-20'>
      <div className='mx-auto flex max-w-[1500px] flex-col gap-5 md:flex-row md:items-start md:justify-center'>
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className='gap-5 md:max-w-[700px]'
        >
          <Badge
            children={t.whyUs}
            className='mb-5 bg-sky-200 px-2 py-1 text-sky-600 font-bold'
          />
          <h2 className='text-3xl font-extrabold md:text-5xl'>
            {t.whyUsBefore}{' '}
            <span className='text-sky-400'>{t.whyUsHighlight}</span>
          </h2>
          <p className='mt-5 mb-5 max-w-[700px] text-base text-gray-600 md:text-lg'>
            {t.whyUsText}
          </p>
          <Button
            onClick={() => navigate('/about')}
            children={t.learnMore}
            className='bg-gradient-to-r from-sky-600 to-sky-800 text-white font-semibold'
          />
        </motion.div>

        {/* Bloc image — arrive de la DROITE */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className='mx-auto mt-10 grid w-full max-w-[700px] grid-cols-1 gap-6 lg:grid-cols-2'
        >
          <div className='flex flex-col justify-center gap-3 rounded-lg bg-white p-6 shadow-md'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-xl text-sky-600'>
              🚀
            </div>
            <h3 className='text-xl font-bold'>{t.innovation}</h3>
            <p className='text-gray-600'>{t.innovationText}</p>
          </div>
          <div className='flex flex-col justify-center gap-3 rounded-lg bg-white p-6 shadow-md'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-xl text-sky-600'>
              ⚡
            </div>
            <h3 className='text-xl font-bold'>{t.performance}</h3>
            <p className='text-gray-600'>{t.performanceText}</p>
          </div>
          <div className='flex flex-col justify-center gap-3 rounded-lg bg-white p-6 shadow-md'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-xl text-sky-600'>
              🤝
            </div>
            <h3 className='text-xl font-bold'>{t.partnership}</h3>
            <p className='text-gray-600'>{t.partnershipText}</p>
          </div>
          <div className='flex flex-col justify-center gap-3 rounded-lg bg-white p-6 shadow-md'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-xl text-sky-600'>
              🎯
            </div>
            <h3 className='text-xl font-bold'>{t.commitment}</h3>
            <p className='text-gray-600'>{t.commitmentText}</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function TestimonialsSection () {
  const { t } = useLanguage()
  const [avis, setAvis] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    let annule = false
    getAvisPublies()
      .then(data => {
        if (!annule) setAvis(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  if (!chargement && avis.length === 0) return null

  return (
    <section className=' px-4 py-20'>
      <div className='mx-auto flex max-w-[1500px] flex-col items-center justify-center space-y-10'>
        <div className='flex flex-col items-center justify-center'>
          <Badge
            children={t.achievements}
            className='mb-5 bg-sky-200 px-2 py-1 text-sky-600 font-bold'
          />
          <h2 className='text-3xl font-extrabold md:text-5xl'>
            {t.testimonialsBefore}{' '}
            <span className='text-sky-400'>{t.testimonialsHighlight}</span>
          </h2>
        </div>
        {!chargement && <TestimonialsCarousel avis={avis} />}
      </div>
    </section>
  )
}

function FaqSection () {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <section className='home-tinted-section px-4 py-20'>
      <div className='mx-auto max-w-[1500px]'>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className='flex flex-col items-center justify-center'
        >
          <Badge
            children={'FAQ'}
            className='mb-5 bg-sky-200 px-2 py-1 text-sky-600 font-bold'
          />
          <h2 className='text-4xl font-extrabold md:text-5xl'>
            {t.faqTitleBefore}{' '}
            <span className='text-sky-400'>{t.faqTitleHighlight}</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className='mt-10 flex flex-col items-center justify-center'
        >
          <Faq />

          <Button
            onClick={() => navigate('/FaqContainer')}
            children={t.seeAll}
            icon={' →'}
          className='mt-10 w-full rounded-xl border border-sky-300 bg-white px-5 py-3 text-base font-semibold text-sky-700 shadow-sm transition hover:border-sky-500 hover:bg-sky-600 hover:text-white md:w-auto'
          />
        </motion.div>
      </div>
    </section>
  )
}

function NewsCard ({ annonce }) {
  const date = new Date(annonce.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className='flex h-full flex-col rounded-2xl border border-sky-100 bg-white p-6 shadow-sm transition hover:shadow-lg'>
      <span className='mb-3 w-fit rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-500'>
        {annonce.categorie}
      </span>
      <h3 className='flex-1 text-lg font-bold text-gray-900'>{annonce.titre}</h3>
      <p className='mt-4 text-xs text-gray-400'>{date}</p>
    </div>
  )
}

function NewsSection () {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [annonces, setAnnonces] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    let annule = false
    getAnnonces()
      .then(data => {
        if (!annule) setAnnonces(data.slice(0, 3))
      })
      .catch(() => {})
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  if (!chargement && annonces.length === 0) return null

  return (
    <section className='w-full overflow-x-hidden px-4 py-16'>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className='mx-auto flex max-w-[1500px] flex-col justify-between gap-6 md:flex-row md:items-center'
      >
        <div>
          <Badge
            children={t.projects}
            className='mb-5 bg-sky-200 px-2 py-1 text-sky-600 font-bold'
          />
          <h2 className='text-3xl font-extrabold break-words md:text-5xl'>
            {t.newsBefore}{' '}
            <span className='text-sky-400'>{t.newsHighlight}</span>
          </h2>
        </div>
        <Button
          onClick={() => navigate('/annonces')}
          children={t.seeAll}
          icon={' →'}
          className='mt-0 w-full rounded-xl border border-sky-300 bg-white px-5 py-3 text-base font-semibold text-sky-700 shadow-sm transition hover:border-sky-500 hover:bg-sky-600 hover:text-white md:mt-10 md:w-auto'
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className='mx-auto mt-10 grid max-w-[1500px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
      >
        {annonces.map(annonce => (
          <NewsCard key={annonce.id} annonce={annonce} />
        ))}
      </motion.div>
    </section>
  )
}

function FinalCTASection () {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <section className='home-slogan-cta relative isolate overflow-hidden bg-ink-800 px-4'>
      <div className='relative z-10 flex flex-col items-center justify-center py-16 md:py-20'>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className='w-full max-w-[700px] px-4 text-center'
        >
          <span className='text-4xl animate-float absolute '>🚀</span>
          <h2 className='mb-5 text-3xl font-extrabold text-white md:text-5xl'>
            {t.footerSloganBefore}{' '}
            <span className='text-sky-400'>{t.footerSloganHighlight}</span>
          </h2>
          <p className='text-lg font-medium text-gray-200'>
            {t.contactDescription}
          </p>
        </motion.div>
        <div className='mt-10 flex flex-col gap-4 sm:flex-row'>
          <Button
            onClick={() => navigate('/contact')}
            children={t.start}
            className='home-cta-primary font-semibold'
            icon={'  →'}
          />
          <Button
            onClick={() => navigate('/produits')}
            children={t.shop}
            className='home-cta-secondary font-semibold'
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
    <section className='home-contact-cta flex flex-col items-center justify-center bg-ink-900 px-4 text-center'>
      <div className='relative z-10 py-16 md:py-20'>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className='flex w-full max-w-[900px] flex-col items-center justify-center text-center'
        >
          <div className='home-contact-cta__badge mb-3 flex max-w-[320px] items-center gap-3 rounded-full bg-white px-4 py-2 ring-1 ring-sky-400'>
            <LiveDot />
            <p className='text-xs font-bold text-[var(--btn-color)]'>
              {t.talkProject}
            </p>
          </div>
          <h2 className='home-contact-cta__title mt-5 mb-5 text-3xl font-extrabold md:text-5xl'>
            {t.readyBefore}{' '}
            <span className='text-sky-400'>{t.readyHighlight}</span>
          </h2>
          <p className='home-contact-cta__description text-lg font-medium'>
            {t.trustedCompanies}
          </p>
        </motion.div>

        <div className='mt-10 flex flex-col justify-center gap-4 sm:flex-row'>
          <Button
            children={t.talkToExpert}
            icon={'  →'}
            onClick={() => navigate('/contact')}
            className='home-cta-primary font-semibold'
          />
          <Button
            children={t.servicesLabel}
            onClick={() => navigate('/services')}
            className='home-cta-secondary font-semibold'
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

function TestimonialCard ({ avis }) {
  return (
    <div className='flex h-full min-h-[245px] flex-col rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:min-h-[260px] sm:p-6'>
      <div className='flex gap-0.5 mb-4'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < avis.note ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
          />
        ))}
      </div>

      <p className='flex-1 text-sm italic leading-relaxed text-gray-600 sm:text-base'>
        "{avis.commentaire}"
      </p>

      <div className='flex items-center gap-3'>
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white font-semibold'>
          {avis.clientNom?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p className='font-semibold text-gray-900 text-sm'>
            {avis.clientNom}
          </p>
        </div>
      </div>
    </div>
  )
}

function useVisibleCount () {
  const [visibleCount, setVisibleCount] = useState(1)

  useEffect(() => {
    function updateCount () {
      const width = window.innerWidth
      if (width >= 1024) setVisibleCount(3) // lg
      else if (width >= 640) setVisibleCount(2) // sm
      else setVisibleCount(1) // mobile
    }

    updateCount()
    window.addEventListener('resize', updateCount)
    return () => window.removeEventListener('resize', updateCount)
  }, [])

  return visibleCount
}

function TestimonialsCarousel ({ avis }) {
  const visibleCount = useVisibleCount()
  const [rawIndex, setIndex] = useState(0)

  const maxIndex = Math.max(avis.length - visibleCount, 0)
  // Dérivé directement au rendu (plutôt que via un effect) : reste toujours dans les bornes
  // même juste après un redimensionnement qui réduit maxIndex, sans flash d'un slide vide.
  const index = Math.min(rawIndex, maxIndex)

  function prev () {
    setIndex(index === 0 ? maxIndex : index - 1)
  }

  function next () {
    setIndex(index === maxIndex ? 0 : index + 1)
  }

  const cardWidthPercent = 100 / visibleCount

  return (
    <div className='relative mx-auto w-full min-w-0 max-w-[1500px] px-8 sm:px-12'>
      {/* Piste défilante */}
      <div className='overflow-hidden'>
        <div
          className='flex transition-transform duration-500 ease-out'
          style={{ transform: `translateX(-${index * cardWidthPercent}%)` }}
        >
          {avis.map(a => (
            <div
              key={a.id}
              className='min-w-0 shrink-0 px-1.5 sm:px-3'
              style={{ width: `${cardWidthPercent}%` }}
            >
              <TestimonialCard avis={a} />
            </div>
          ))}
        </div>
      </div>

      {/* Flèches — DANS le padding, pas translatées hors du conteneur */}
      <button
        onClick={prev}
        aria-label='Témoignage précédent'
        className='absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white shadow-md transition hover:bg-sky-50 sm:h-10 sm:w-10'
      >
        <ChevronLeft size={18} className='text-sky-600' />
      </button>
      <button
        onClick={next}
        aria-label='Témoignage suivant'
        className='absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white shadow-md transition hover:bg-sky-50 sm:h-10 sm:w-10'
      >
        <ChevronRight size={18} className='text-sky-600' />
      </button>

      {/* Indicateurs (dots) */}
      <div className='flex justify-center gap-2 mt-6'>
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Afficher le témoignage ${i + 1}`}
            aria-current={i === index ? 'true' : undefined}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-sky-500' : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
