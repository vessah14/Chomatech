import Badge from '../Components/ui/Badge'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { equipe } from '../data/Equipe'
import CardEquipe from '../Components/ui/CardEquipe'
import Button from '../Components/ui/Button'
import { useNavigate } from 'react-router-dom'

export default function About () {
  return (
    <>
      <HeroSection />
      <ValeurSection />
      <EquipeSection />
      <BottomCTASection />
    </>
  )
}

function HeroSection () {
  const { t } = useLanguage()

  return (
    <>
      <div
        className='about-hero business-page-hero relative py-12 sm:py-16 lg:py-20'
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'
        >
          <div className='grid grid-cols-1 items-center justify-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16'>
            <div className='about-hero__copy'>
              <Badge
                children={t.about}
                className='about-hero__badge bg-sky-200 px-3 py-1 font-bold text-sky-500'
              />
              <h1 className='mt-5 max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-[3.4rem]'>
                {t.aboutTitleBefore}{' '}
                <span className='text-sky-400'>{t.aboutTitleHighlight}</span>
              </h1>
              <p className='mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8'>
                {t.aboutDescription}
              </p>
            </div>
            <div className='flex items-center justify-center px-2 py-6 sm:px-8 lg:p-0'>
              <div className='about-hero__visual relative w-full max-w-xl'>
                {/* Main image */}
                <div className='about-hero__image overflow-hidden rounded-[1.75rem]'>
                  <img
                    src='/about.jpg'
                    alt='Équipe au travail sur des ordinateurs portables'
                    className='h-[300px] w-full object-cover sm:h-[380px] lg:h-[430px]'
                  />
                </div>

                {/* Floating stat badge */}
                <div className='about-hero__stat absolute -bottom-5 left-4 rounded-2xl px-5 py-4 text-white sm:-bottom-6 sm:left-6 sm:px-6'>
                  <p className='text-3xl font-extrabold leading-none'>98%</p>
                  <p className='text-sm mt-1 text-sky-50'>
                    {t.clientSatisfaction}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}

function ValeurSection () {
  const { t } = useLanguage()

  return (
    <>
      <section className='about-values-section px-4 py-16 sm:px-6 sm:py-20 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className='mx-auto max-w-7xl px-0 pb-10 text-center'
        >
          <span className='about-section-kicker'>{t.about}</span>
          <h2 className='mt-4 text-3xl font-bold text-slate-900 sm:text-4xl'>{t.ourValues}</h2>
          <p className='mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg'>{t.ourValuesDescription}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className='mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'
        >
          <div className='bg-sky-50 rounded-xl border border-sky-400 hover:shadow-sky-200 hover:-translate-y-2 duration-300 ease-in-out  hover:shadow-lg p-3  flex flex-col'>
            <div className='flex '>
              <span className='text-2xl bg-sky-50 rounded-xl p-2 flex'>🎯</span>
            </div>
            <h1 className='text-xl font-bold text-gray-800 mb-4'>
              {t.excellenceTitle}
            </h1>
            <p className='text-gray-500 text-sm'>{t.excellenceDescription}</p>
          </div>

          <div className='bg-sky-50 rounded-xl border border-sky-400 hover:shadow-sky-200 hover:-translate-y-2 duration-300 ease-in-out  hover:shadow-lg p-3  flex flex-col'>
            <div className='flex '>
              <span className='text-2xl bg-sky-50 rounded-xl p-2 flex'>🤝</span>
            </div>
            <h1 className='text-xl font-bold text-gray-800 mb-4'>
              {t.integrityTitle}
            </h1>
            <p className='text-gray-500 text-sm'>{t.integrityDescription}</p>
          </div>

          <div className='bg-sky-50 rounded-xl border border-sky-400 hover:shadow-sky-200 hover:-translate-y-2 duration-300 ease-in-out  hover:shadow-lg p-3  flex flex-col'>
            <div className='flex '>
              <span className='text-2xl bg-sky-50 rounded-xl p-2 flex'>🚀</span>
            </div>
            <h1 className='text-xl font-bold text-gray-800 mb-4'>
              {t.innovationTitle}
            </h1>
            <p className='text-gray-500 text-sm'>{t.innovationDescription}</p>
          </div>

          <div className='bg-sky-50 rounded-xl border border-sky-400 hover:shadow-sky-200 hover:-translate-y-2 duration-300 ease-in-out  hover:shadow-lg p-3  flex flex-col'>
            <div className='flex '>
              <span className='text-2xl bg-sky-50 rounded-xl p-2 flex'>🌍</span>
            </div>
            <h1 className='text-xl font-bold text-gray-800 mb-4'>
              {t.impactTitle}
            </h1>
            <p className='text-gray-500 text-sm'>{t.impactDescription}</p>
          </div>
        </motion.div>
      </section>
    </>
  )
}

function EquipeSection () {
  const { t } = useLanguage()

  return (
    <>
      <section className='about-team-section px-4 py-16 sm:px-6 sm:py-20 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className='mx-auto max-w-5xl px-0 text-center'
        >
          <span className='about-section-kicker'>{t.about}</span>
          <h2 className='mt-4 text-3xl font-bold text-slate-900 sm:text-4xl'>{t.ourTeam}</h2>
          <p className='mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg'>{t.ourTeamDescription}</p>
          <div className='about-team-grid mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6'>
            {equipe.map(menbre => (
              <CardEquipe
                key={menbre.id}
                imageSrc={menbre.imageSrc}
                name={menbre.name}
                role={menbre.role}
                Poste={menbre.Poste}
                className='about-team-card mx-auto w-full max-w-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg'
              />
            ))}
          </div>
        </motion.div>
      </section>
    </>
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
            onClick={() => navigate('/contact')}
            children={t.talkToExpert}
            icon={'  →'}
            className='bg-white text-sky-700 font-semibold'
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
