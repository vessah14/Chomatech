import React, { useEffect, useState } from 'react'
import { Check, Search, Filter, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { getMesDemandesServices } from '../../api/services'

// Progression dérivée du vrai statut (pas de pourcentage inventé) : l'ordre reflète le
// cycle de traitement réel : une demande naît en "Validation" (défaut backend, en attente de
// validation/devis par l'admin), passe "En cours" une fois acceptée, puis "Terminé".
const steps = ['Validation', 'En cours', 'Terminé']

const statusConfig = {
  'En cours': {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    ring: 'ring-amber-200/50',
    dot: 'bg-amber-400 animate-pulse'
  },
  Validation: {
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    ring: 'ring-sky-200/50',
    dot: 'bg-sky-400'
  },
  Terminé: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    ring: 'ring-emerald-200/50',
    dot: 'bg-emerald-400'
  },
  Annulée: {
    bg: 'bg-red-50',
    text: 'text-red-500',
    ring: 'ring-red-200/50',
    dot: 'bg-red-400'
  }
}

function formatMontant (n, t) {
  return n != null ? `${n.toLocaleString('fr-FR')} FCFA` : t.adminOnQuote
}

function formatDate (iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ───────── STEPPER ───────── */
function Stepper ({ statut }) {
  const currentStep = steps.indexOf(statut) + 1

  return (
    <div className='overflow-x-auto pb-2'>
      <div className='flex min-w-[420px] items-center w-full'>
        {steps.map((label, i) => {
          const stepNum = i + 1
          const isDone = stepNum < currentStep
          const isCurrent = stepNum === currentStep
          const isLast = i === steps.length - 1

          return (
            <React.Fragment key={label}>
              <div className='flex flex-col items-center shrink-0'>
                <div
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    isDone
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-200'
                      : isCurrent
                        ? 'bg-white text-sky-600 border-2 border-sky-500 shadow-md shadow-sky-100'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isCurrent && (
                    <span className='absolute inset-0 rounded-full animate-ping bg-sky-400 opacity-20' />
                  )}
                  {isDone ? <Check className='w-4 h-4' strokeWidth={3} /> : stepNum}
                </div>
                <span
                  className={`mt-2 max-w-20 text-center text-[11px] leading-tight sm:text-xs font-medium ${
                    isDone ? 'text-sky-600' : isCurrent ? 'text-sky-600 font-semibold' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>

              {!isLast && (
                <div className='relative h-0.5 flex-1 mx-2 mb-6 bg-gray-200 rounded-full overflow-hidden'>
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full bg-sky-500 transition-all duration-700 ${
                      isDone ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

/* ───────── SERVICE CARD ───────── */
function ServiceCard ({ demande, t }) {
  const [expanded, setExpanded] = useState(false)
  const status = statusConfig[demande.statut] || statusConfig.Validation
  const progress = demande.statut === 'Annulée'
    ? 0
    : Math.round(((steps.indexOf(demande.statut) + 1) / steps.length) * 100)

  return (
    <div className='group rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-200'>
      <div className='p-6 pb-0'>
        <div className='flex flex-col items-start justify-between gap-3 sm:flex-row'>
          <div className='min-w-0'>
            <h3 className='font-bold text-gray-900 break-words text-lg'>{demande.nomService}</h3>
            <div className='flex items-center gap-3 mt-1 flex-wrap'>
              <span className='text-sm text-gray-400'>{formatDate(demande.createdAt)}</span>
              <span className='text-sm font-semibold text-gray-700'>
                {formatMontant(demande.montantConvenu, t)}
              </span>
            </div>
          </div>

          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${status.bg} ${status.text} ${status.ring}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {demande.statut}
          </span>
        </div>

        {demande.statut !== 'Annulée' && (
          <div className='mt-4 flex items-center gap-3'>
            <div className='relative h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden'>
              <div
                className='absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-300 to-sky-500 transition-all duration-700'
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className='text-xs font-semibold text-gray-500 tabular-nums'>{progress}%</span>
          </div>
        )}
      </div>

      {demande.statut !== 'Annulée' && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className='w-full flex items-center justify-center gap-1 py-3 text-xs font-medium text-gray-400 transition hover:text-sky-500'
          >
            {expanded ? t.adminHideSteps : t.adminViewSteps}
            <ChevronDown size={14} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </button>

          <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-40 px-6 pb-6' : 'max-h-0'}`}>
            <Stepper statut={demande.statut} />
          </div>
        </>
      )}
    </div>
  )
}

/* ───────── STATS RAPIDES ───────── */
function QuickStats ({ demandes, t }) {
  const stats = [
    { label: t.adminStatTotal, value: demandes.length, color: 'text-gray-900' },
    { label: t.adminStatOngoing, value: demandes.filter(s => s.statut === 'En cours').length, color: 'text-amber-600' },
    { label: t.adminStatValidation, value: demandes.filter(s => s.statut === 'Validation').length, color: 'text-sky-600' },
    { label: t.adminStatCompleted, value: demandes.filter(s => s.statut === 'Terminé').length, color: 'text-emerald-600' }
  ]

  return (
    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
      {stats.map(stat => (
        <div key={stat.label} className='rounded-xl bg-white border border-gray-100 p-4 text-center'>
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          <p className='text-xs text-gray-400 mt-0.5 font-medium'>{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

/* ───────── PAGE PRINCIPALE ───────── */
export default function MesServices () {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [demandes, setDemandes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [activeFilter, setActiveFilter] = useState('Tous')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!user) return
    let annule = false
    getMesDemandesServices(user.id)
      .then(data => {
        if (!annule) setDemandes(data)
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
  }, [user])

  const filters = ['Tous', 'Validation', 'En cours', 'Terminé', 'Annulée']

  const filtered = demandes.filter(d => {
    const matchFilter = activeFilter === 'Tous' || d.statut === activeFilter
    const matchSearch = d.nomService.toLowerCase().includes(searchQuery.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div className='max-w-[1700px] mx-auto space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-extrabold text-gray-900'>{t.adminMyServices}</h1>
          <p className='text-gray-500 mt-1'>{t.adminServicesSubtitle}</p>
        </div>
      </div>

      {erreur && <p className='text-sm text-red-500'>{erreur}</p>}

      <QuickStats demandes={demandes} t={t} />

      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
        <div className='flex items-center gap-2 flex-wrap'>
          <Filter size={16} className='text-gray-400' />
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activeFilter === f
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-200'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className='relative w-full sm:w-64'>
          <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
          <input
            type='text'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.adminSearchServicePlaceholder}
            className='w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 transition'
          />
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        {chargement ? (
          <p className='text-center text-gray-400 py-12'>{t.loading}</p>
        ) : filtered.length > 0 ? (
          filtered.map(d => <ServiceCard key={d.id} demande={d} t={t} />)
        ) : (
          <div className='rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center'>
            <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-50'>
              <Search size={22} className='text-gray-300' />
            </div>
            <p className='mt-4 text-gray-500 font-medium'>{t.adminNoServicesFound}</p>
            <p className='mt-1 text-sm text-gray-400'>{t.adminTryOtherFilter}</p>
          </div>
        )}
      </div>
    </div>
  )
}
