import Badge from '../Components/ui/Badge'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useState } from 'react'
import { envoyerMessageContact } from '../api/contact'
import { useParametres } from '../api/parametres'

export default function Contact () {
  return (
    <>
      <Herosection />
      <ContactPage />
    </>
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
        className='contact-hero business-page-hero flex flex-col items-center justify-center gap-8 px-4 py-12 sm:px-6 md:py-16 lg:min-h-[340px]'
      >
        <div className='flex flex-col items-center'>
          <Badge
            children={t.speakProject}
            className='bg-sky-200 px-3 py-1 text-sky-500 font-bold mb-2'
          />
          <h1 className='mt-4 max-w-[800px] text-center text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-[3.4rem]'>
            {t.contactTitleBefore}{' '}
            <span className='text-sky-400'>{t.contactTitleHighlight}</span>
          </h1>
          <p className='mt-5 max-w-[700px] text-center text-base leading-7 text-slate-300 sm:text-lg sm:leading-8'>
            {t.contactDescription}
          </p>
        </div>
      </motion.section>
    </>
  )
}

import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react'

const contactInfo = [
  {
    icon: MapPin,
    labelKey: 'address',
    value: 'Avenue des Nations Unies\nDouala, Cameroun',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-500'
  },
  {
    icon: Phone,
    labelKey: 'phone',
    value: '+237 6XX XXX XXX',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-500'
  },
  {
    icon: Mail,
    labelKey: 'email',
    value: 'contact@chomatech.cm',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-500'
  },
  {
    icon: MessageCircle,
    labelKey: 'whatsapp',
    value: 'Discuter maintenant',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500'
  }
]

const schedule = [
  { dayKey: 'weekdays', hours: '8h00 – 18h00', closed: false },
  { dayKey: 'saturday', hours: '9h00 – 16h00', closed: false },
  { dayKey: 'sunday', hours: 'closed', closed: true }
]

const services = [
  'Création de sites web',
  'IA & Automatisation',
  'Solutions digitales',
  'Design & UX/UI',
  'Conseil digital'
]
const budgets = [
  'Moins de 500 000 FCFA',
  '500 000 - 1 500 000 FCFA',
  '1 500 000 - 5 000 000 FCFA',
  'Plus de 5 000 000 FCFA'
]

function ContactInfoCard ({ icon: Icon, label, value, iconBg, iconColor, href }) {
  // Cliquable quand une action existe (appeler, écrire un email, ouvrir WhatsApp).
  const Conteneur = href ? 'a' : 'div'
  return (
    <Conteneur
      {...(href ? { href, target: href.startsWith('http') ? '_blank' : undefined, rel: 'noopener noreferrer' } : {})}
      className={`contact-info-card flex items-start gap-4 rounded-2xl border border-sky-100 bg-white p-5 ${href ? 'transition hover:border-sky-300 hover:shadow-sm' : ''}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        <Icon size={20} className={iconColor} />
      </div>
      <div>
        <p className='text-xs font-semibold uppercase tracking-wide text-gray-400'>
          {label}
        </p>
        <p className='mt-1 font-semibold text-gray-900 whitespace-pre-line'>
          {value}
        </p>
      </div>
    </Conteneur>
  )
}

const champsVide = {
  nomComplet: '',
  email: '',
  telephone: '',
  entreprise: '',
  serviceSouhaite: '',
  budget: '',
  message: ''
}

function ContactPage () {
  const { t } = useLanguage()
  const parametres = useParametres()

  // Coordonnées réelles saisies dans l'admin (Paramètres) ; valeurs statiques en attendant.
  const telephone = parametres?.telephone ?? contactInfo.find(i => i.labelKey === 'phone').value
  const email = parametres?.email ?? contactInfo.find(i => i.labelKey === 'email').value
  // Numéro exploitable (au moins 8 chiffres) : sinon pas de lien tel:/WhatsApp vers un
  // numéro factice du type "+237 6XX XXX XXX".
  const chiffres = telephone.replace(/\D/g, '')
  const numeroValide = chiffres.length >= 8

  const coordonnees = contactInfo
    .filter(info => info.labelKey !== 'whatsapp' || numeroValide)
    .map(info => {
      if (info.labelKey === 'address') return parametres ? { ...info, value: parametres.adresse } : info
      if (info.labelKey === 'phone') return { ...info, value: telephone, href: numeroValide ? `tel:+${chiffres}` : undefined }
      if (info.labelKey === 'email') return { ...info, value: email, href: `mailto:${email}` }
      if (info.labelKey === 'whatsapp') return { ...info, href: `https://wa.me/${chiffres}` }
      return info
    })

  const [formData, setFormData] = useState(champsVide)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)

  const majChamp = (champ, valeur) => {
    setFormData(current => ({ ...current, [champ]: valeur }))
  }

  const soumettre = async event => {
    event.preventDefault()
    if (!formData.nomComplet || !formData.email || !formData.message) return

    setEnvoi(true)
    setErreur('')
    try {
      await envoyerMessageContact({
        nomComplet: formData.nomComplet,
        email: formData.email,
        telephone: formData.telephone || null,
        entreprise: formData.entreprise || null,
        serviceSouhaite: formData.serviceSouhaite || null,
        budget: formData.budget || null,
        message: formData.message
      })
      setFormData(champsVide)
      setSucces(true)
      setTimeout(() => setSucces(false), 5000)
    } catch (err) {
      setErreur(err.message || t.contactFormError)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <section className='contact-layout mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[.85fr_1.15fr] lg:gap-12 lg:px-8'>
      {/* Colonne gauche — infos */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className='contact-info-column w-full'
      >
        <h2 className='mb-3 text-3xl font-bold text-slate-900 sm:text-4xl'>
          {t.contactWays}
        </h2>
        <p className='mb-6 leading-7 text-slate-600'>{t.contactAvailability}</p>

        <div className='flex flex-col gap-4'>
          {coordonnees.map(info => (
            <ContactInfoCard
              key={info.labelKey}
              {...info}
              label={t[info.labelKey]}
            />
          ))}

          {/* Horaires */}
          <div className='contact-hours-card rounded-2xl border border-sky-100 bg-white p-5'>
            <p className='text-xs font-semibold tracking-wide text-gray-400 mb-3'>
              {t.hours}
            </p>
            <div className='flex flex-col gap-2'>
              {schedule.map(s => (
                <div
                  key={s.dayKey}
                  className='flex items-center justify-between text-sm'
                >
                  <span className='text-gray-600'>{t[s.dayKey]}</span>
                  <span
                    className={`font-semibold ${
                      s.closed ? 'text-red-500' : 'text-emerald-600'
                    }`}
                  >
                    {t[s.hours] || s.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Colonne droite — formulaire */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className='contact-form-panel rounded-2xl border border-sky-100 bg-white p-5 sm:p-8'
      >
        <h3 className='mb-2 text-xl font-bold text-slate-900'>
          {t.describeProject}
        </h3>
        <p className='contact-form-intro mb-6 text-sm leading-6 text-slate-500'>{t.contactAvailability}</p>

        <form onSubmit={soumettre} className='flex flex-col gap-5'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
            <div>
              <label className='block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
                {t.fullName}
              </label>
              <input
                type='text'
                required
                value={formData.nomComplet}
                onChange={e => majChamp('nomComplet', e.target.value)}
                placeholder='Jean Dupont'
                className='w-full rounded-xl border border-sky-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300'
              />
            </div>
            <div>
              <label className='block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
                {t.email} *
              </label>
              <input
                type='email'
                required
                value={formData.email}
                onChange={e => majChamp('email', e.target.value)}
                placeholder='jean@entreprise.com'
                className='w-full rounded-xl border border-sky-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
            <div>
              <label className='block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
                {t.phone}
              </label>
              <input
                type='tel'
                value={formData.telephone}
                onChange={e => majChamp('telephone', e.target.value)}
                placeholder='+237 6XX XXX XXX'
                className='w-full rounded-xl border border-sky-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300'
              />
            </div>
            <div>
              <label className='block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
                {t.company}
              </label>
              <input
                type='text'
                value={formData.entreprise}
                onChange={e => majChamp('entreprise', e.target.value)}
                placeholder={t.companyPlaceholder}
                className='w-full rounded-xl border border-sky-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300'
              />
            </div>
          </div>

          <div>
            <label className='block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
              {t.desiredService}
            </label>
            <select
              value={formData.serviceSouhaite}
              onChange={e => majChamp('serviceSouhaite', e.target.value)}
              className='w-full rounded-xl border border-sky-200 px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-300'
            >
              <option value=''>{t.chooseService}</option>
              {services.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
              {t.estimatedBudget}
            </label>
            <select
              value={formData.budget}
              onChange={e => majChamp('budget', e.target.value)}
              className='w-full rounded-xl border border-sky-200 px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-300'
            >
              <option value=''>{t.budgetRange}</option>
              {budgets.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
              {t.message}
            </label>
            <textarea
              rows={5}
              required
              value={formData.message}
              onChange={e => majChamp('message', e.target.value)}
              placeholder={t.messagePlaceholder}
              className='w-full rounded-xl border border-sky-200 px-4 py-3 text-sm placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-sky-300'
            />
          </div>

          {erreur && <p className='text-sm text-red-500'>{erreur}</p>}
          {succes && <p className='text-sm text-emerald-600 font-medium'>{t.contactFormSuccess}</p>}

          <button
            type='submit'
            disabled={envoi}
            className='contact-submit mt-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-800 py-3.5 font-semibold text-white shadow-md transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
          >
            {envoi ? t.sending : t.sendRequest}
          </button>
        </form>
      </motion.div>
    </section>
  )
}
