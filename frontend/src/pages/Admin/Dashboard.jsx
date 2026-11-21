import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ArrowRight, Package, Truck, Settings, MessageSquare, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { getMesDemandesProduits } from '../../api/demandesProduits'
import { getMesDemandesServices } from '../../api/services'
import { getMesConversations } from '../../api/conversations'
import { getMesNotifications } from '../../api/notifications'
import { resolveMediaUrl } from '../../api/client'

// Cycle de traitement réel des commandes produits (voir MesCommandes.jsx / Produits.jsx admin).
// Valeurs de statut non traduites : ce sont des données venant du backend, pas du texte d'UI.
const orderSteps = ['Préparation', 'En cours', 'Livrée']

function formatMontant (n) {
  return `${n.toLocaleString('fr-FR')} FCFA`
}

function tempsRelatif (iso, t) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const heures = Math.floor(diffMs / 3_600_000)
  if (heures < 1) return t.adminTimeJustNow
  if (heures < 24) return t.adminTimeHoursAgo.replace('{n}', heures)
  const jours = Math.floor(heures / 24)
  return jours === 1 ? t.adminTimeYesterday : t.adminTimeDaysAgo.replace('{n}', jours)
}

const colorMap = {
  sky: { bg: 'bg-sky-50', icon: 'text-sky-500' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-500' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-500' }
}

export default function Dashboard () {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [donnees, setDonnees] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!user) return
    let annule = false

    Promise.all([
      getMesDemandesProduits(user.id),
      getMesDemandesServices(user.id),
      getMesConversations(user.id),
      getMesNotifications(user.id)
    ])
      .then(([demandesProduits, demandesServices, conversations, notifications]) => {
        if (!annule) setDonnees({ demandesProduits, demandesServices, conversations, notifications })
      })
      .catch(err => {
        if (!annule) setErreur(err.message)
      })

    return () => {
      annule = true
    }
  }, [user])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t.adminGreetingMorning : hour < 18 ? t.adminGreetingAfternoon : t.adminGreetingEvening

  if (erreur) return <p className='text-sm text-red-500'>{erreur}</p>
  if (!donnees) return <p className='text-sm text-gray-400'>{t.loading}</p>

  const { demandesProduits, demandesServices, conversations, notifications } = donnees

  const nbCommandes = demandesProduits.length + demandesServices.length
  const nbEnCours =
    demandesProduits.filter(d => d.statut === 'Préparation' || d.statut === 'En cours').length +
    demandesServices.filter(d => d.statut === 'En cours' || d.statut === 'Validation').length
  const nbServicesActifs = demandesServices.filter(d => d.statut !== 'Annulée' && d.statut !== 'Terminé').length
  const messages = conversations[0]?.messages || []
  const nbMessagesNonLus = messages.filter(m => m.sender === 'admin' && !m.lu).length

  const cards = [
    { icone: Package, compteur: nbCommandes, label: t.adminStatOrders, color: 'sky' },
    { icone: Truck, compteur: nbEnCours, label: t.adminStatOngoing, color: 'amber' },
    { icone: Settings, compteur: nbServicesActifs, label: t.adminStatActiveServices, color: 'emerald' },
    { icone: MessageSquare, compteur: nbMessagesNonLus, label: t.adminStatUnreadMessages, color: 'violet' }
  ]

  const commandeEnCours = [...demandesProduits]
    .filter(d => d.statut === 'Préparation' || d.statut === 'En cours')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]

  const activites = [
    ...demandesProduits.map(d => ({
      icon: Truck,
      color: 'bg-amber-50 text-amber-500',
      title: `${t.adminOrderLabel} "${d.nomProduit}" — ${d.statut}`,
      date: d.createdAt
    })),
    ...demandesServices.map(d => ({
      icon: Settings,
      color: 'bg-sky-50 text-sky-500',
      title: `${t.adminServiceLabel} "${d.nomService}" — ${d.statut}`,
      date: d.createdAt
    })),
    ...notifications.map(n => ({
      icon: Bell,
      color: 'bg-violet-50 text-violet-500',
      title: n.titre,
      date: n.createdAt
    }))
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  return (
    <section className='max-w-[1700px] mx-auto space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4'>
        <div className='space-y-1'>
          <p className='text-sm font-medium text-gray-400'>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className='text-3xl sm:text-4xl font-extrabold text-gray-900'>
            {greeting},{' '}
            <span className='bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent'>
              {user?.prenom || ''}
            </span>
          </h1>
          <p className='text-base text-gray-500'>{t.adminActivitySummary}</p>
        </div>
        <Link
          to='/produits'
          className='inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md'
        >
          <Package size={18} />
          {t.adminBrowseProducts}
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {cards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
        <div className='xl:col-span-2'>
          <CommandeEnCours commande={commandeEnCours} t={t} />
        </div>
        <RecentActivity activites={activites} t={t} />
      </div>
    </section>
  )
}

function StatCard ({ icone: Icon, compteur, label, color }) {
  const c = colorMap[color]
  return (
    <div className='group rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg'>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg}`}>
        <Icon size={22} className={c.icon} />
      </div>
      <h2 className='mt-4 text-3xl font-bold text-gray-900'>{compteur}</h2>
      <p className='mt-1 text-sm font-medium text-gray-400'>{label}</p>
    </div>
  )
}

function OrderTracker ({ statut }) {
  const currentStep = orderSteps.indexOf(statut)

  return (
    <div className='overflow-x-auto pb-2'>
      <div className='flex min-w-[420px] items-center'>
        {orderSteps.map((label, index) => {
          const isDone = index < currentStep
          const isCurrent = index === currentStep
          const isLast = index === orderSteps.length - 1

          return (
            <div key={label} className='flex items-center flex-1 last:flex-none'>
              <div className='flex flex-col items-center gap-2'>
                <div
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                    isDone
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-200'
                      : isCurrent
                        ? 'bg-white text-sky-600 border-2 border-sky-500 shadow-md shadow-sky-100'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isCurrent && <span className='absolute inset-0 rounded-full animate-ping bg-sky-400 opacity-20' />}
                  {isDone ? <Check size={16} strokeWidth={3} /> : index + 1}
                </div>
                <span className={`max-w-20 text-center text-[11px] leading-tight sm:text-xs font-medium ${
                  isDone ? 'text-sky-600' : isCurrent ? 'text-sky-600 font-semibold' : 'text-gray-400'
                }`}
                >
                  {label}
                </span>
              </div>

              {!isLast && (
                <div className='relative h-0.5 flex-1 mx-2 bg-gray-200 rounded-full overflow-hidden'>
                  <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${isDone ? 'w-full bg-sky-500' : 'w-0'}`} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CommandeEnCours ({ commande, t }) {
  return (
    <div className='rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50'>
            <Truck size={18} className='text-sky-500' />
          </div>
          <h2 className='text-lg font-bold text-gray-900'>{t.adminCurrentOrder}</h2>
        </div>
        <Link to='/admin/commandes' className='group flex items-center gap-1 text-sm font-medium text-sky-600 transition hover:text-sky-700'>
          {t.seeAll}
          <ArrowRight size={14} className='transition-transform group-hover:translate-x-0.5' />
        </Link>
      </div>

      {commande ? (
        <>
          <div className='flex flex-col items-start gap-4 mb-6 sm:flex-row sm:items-center'>
            {commande.image ? (
              <img
                src={resolveMediaUrl(commande.image)}
                alt={commande.nomProduit}
                className='h-24 w-24 rounded-2xl object-cover shrink-0 ring-1 ring-gray-100'
              />
            ) : (
              <div className='h-24 w-24 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 ring-1 ring-gray-100'>
                <Package size={24} className='text-gray-300' />
              </div>
            )}

            <div className='min-w-0 flex-1'>
              <h3 className='font-bold text-gray-900 break-words text-lg'>{commande.nomProduit}</h3>
              <p className='text-sm text-gray-400 mt-0.5'>{t.adminQuantityLabel} : {commande.quantite}</p>
              <p className='text-sm font-semibold text-gray-700 mt-1'>
                {formatMontant(commande.montantUnitaire * commande.quantite)}
              </p>
            </div>

            <span className='flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-600 ring-1 ring-amber-200/50'>
              <span className='h-2 w-2 rounded-full bg-amber-400 animate-pulse' />
              {commande.statut}
            </span>
          </div>

          <OrderTracker statut={commande.statut} />
        </>
      ) : (
        <p className='text-sm text-gray-400 py-8 text-center'>{t.adminNoCurrentOrder}</p>
      )}
    </div>
  )
}

function RecentActivity ({ activites, t }) {
  return (
    <div className='rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
      <div className='flex items-center justify-between mb-5'>
        <h2 className='text-lg font-bold text-gray-900'>{t.adminRecentActivity}</h2>
      </div>

      {activites.length > 0 ? (
        <div className='space-y-4'>
          {activites.map((activite, index) => {
            const Icon = activite.icon
            return (
              <div key={index} className='group flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-gray-50'>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activite.color}`}>
                  <Icon size={18} />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-semibold text-gray-800 truncate'>{activite.title}</p>
                  <p className='text-xs text-gray-400'>{tempsRelatif(activite.date, t)}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className='text-sm text-gray-400 py-8 text-center'>{t.adminNoRecentActivity}</p>
      )}

      <Link
        to='/admin/notification'
        className='mt-4 flex items-center justify-center gap-1.5 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700'
      >
        <Bell size={14} />
        {t.adminSeeAllActivity}
      </Link>
    </div>
  )
}
