import { useEffect, useState } from 'react'
import {
  Check,
  Star,
  Search,
  Filter,
  Package,
  ChevronDown,
  Truck,
  X,
  Send,
  Pencil,
  Trash2,
  Ban
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import StarRating from '../../Components/ui/StarRating'
import { createAvis } from '../../api/avis'
import {
  getMesDemandesProduits,
  modifierQuantiteDemande,
  annulerDemandeProduit,
  supprimerDemandeProduitClient
} from '../../api/demandesProduits'
import { resolveMediaUrl } from '../../api/client'

// Ordre réel du cycle de traitement (voir Produits.jsx côté admin : Préparation → En cours → Livrée).
const stepLabels = ['Préparation', 'En cours', 'Livrée']

const statusConfig = {
  Préparation: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    ring: 'ring-amber-200/50',
    dot: 'bg-amber-400 animate-pulse'
  },
  'En cours': {
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    ring: 'ring-sky-200/50',
    dot: 'bg-sky-400 animate-pulse'
  },
  Livrée: {
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

function formatMontant (n) {
  return `${n.toLocaleString('fr-FR')} FCFA`
}

function formatDate (iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ───────── STATS ───────── */
function QuickStats ({ commandes, t }) {
  const total = commandes.length
  const enCours = commandes.filter(c => c.statut === 'Préparation' || c.statut === 'En cours').length
  const livrees = commandes.filter(c => c.statut === 'Livrée').length
  const totalMontant = commandes
    .filter(c => c.statut !== 'Annulée')
    .reduce((s, c) => s + c.montantUnitaire * c.quantite, 0)

  const stats = [
    { label: t.adminStatTotal, value: total, icon: Package, color: 'text-gray-900', iconBg: 'bg-gray-50 text-gray-500' },
    { label: t.adminStatOngoing, value: enCours, icon: Truck, color: 'text-amber-600', iconBg: 'bg-amber-50 text-amber-500' },
    { label: t.adminStatDelivered, value: livrees, icon: Check, color: 'text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-500' },
    {
      label: t.adminStatTotalAmount,
      value: formatMontant(totalMontant),
      icon: Package,
      color: 'text-sky-600',
      iconBg: 'bg-sky-50 text-sky-500',
      isPrice: true
    }
  ]

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
      {stats.map(stat => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className='rounded-2xl bg-white border border-gray-100 p-4 flex items-center gap-3'>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className={`${stat.isPrice ? 'text-base' : 'text-2xl'} font-bold ${stat.color}`}>{stat.value}</p>
              <p className='text-[11px] text-gray-400 font-medium'>{stat.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ───────── ORDER TRACKER ───────── */
function OrderTracker ({ statut }) {
  const currentStep = stepLabels.indexOf(statut)

  return (
    <div className='overflow-x-auto pb-2'>
      <div className='flex min-w-[420px] items-center'>
        {stepLabels.map((label, index) => {
          const isDone = index < currentStep
          const isCurrent = index === currentStep
          const isLast = index === stepLabels.length - 1

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
                <span
                  className={`max-w-20 text-center text-[11px] leading-tight sm:text-xs font-medium ${
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
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ───────── MODALE "LAISSER UN AVIS" ───────── */
function AvisModal ({ onClose, t }) {
  const [note, setNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)

  const envoyer = async () => {
    if (note === 0 || !commentaire.trim()) return

    setEnvoi(true)
    setErreur('')
    try {
      await createAvis(note, commentaire)
      setSucces(true)
    } catch (err) {
      setErreur(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4'>
      <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-bold text-gray-900'>{t.adminLeaveReviewTitle}</h2>
          <button onClick={onClose} className='rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600'>
            <X className='h-5 w-5' />
          </button>
        </div>

        {succes ? (
          <div className='py-6 text-center'>
            <p className='text-lg font-semibold text-gray-900'>{t.adminReviewThanks}</p>
            <p className='mt-2 text-sm text-gray-500'>
              {t.adminReviewPublicNotice}
            </p>
            <button
              onClick={onClose}
              className='mt-6 w-full rounded-xl bg-sky-500 py-3 font-bold text-white transition hover:bg-sky-600'
            >
              {t.adminClose}
            </button>
          </div>
        ) : (
          <>
            <label className='mb-2 block text-sm font-medium text-gray-700'>{t.adminYourRating}</label>
            <StarRating value={note} onChange={setNote} size={32} />

            <label className='mb-2 mt-5 block text-sm font-medium text-gray-700'>{t.adminYourComment}</label>
            <textarea
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              placeholder={t.adminReviewPlaceholder}
              rows={4}
              className='w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/40'
            />

            {erreur && <p className='mt-3 text-sm text-red-500'>{erreur}</p>}

            <button
              onClick={envoyer}
              disabled={envoi || note === 0 || !commentaire.trim()}
              className='mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <Send className='h-4 w-4' />
              {envoi ? t.sending : t.adminSendReview}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ───────── ORDER CARD ───────── */
function OrderCard ({ commande, onLeaveReview, onModify, onCancel, onDelete, t }) {
  const [expanded, setExpanded] = useState(false)
  const [quantite, setQuantite] = useState(commande.quantite)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')

  async function appliquerAction (action) {
    setSaving(true)
    setActionError('')
    try {
      await action()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setSaving(false)
    }
  }
  const status = statusConfig[commande.statut] || statusConfig.Préparation

  return (
    <div className='group rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-200'>
      <div className='p-6'>
        <div className='flex flex-col items-start gap-4 sm:flex-row'>
          <div className='relative'>
            {commande.image ? (
              <img
                src={resolveMediaUrl(commande.image)}
                alt={commande.nomProduit}
                className='h-24 w-24 rounded-2xl object-cover shrink-0 ring-1 ring-gray-100 transition-transform group-hover:scale-[1.03]'
              />
            ) : (
              <div className='h-24 w-24 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 ring-1 ring-gray-100'>
                <Package size={24} className='text-gray-300' />
              </div>
            )}
          </div>

          <div className='min-w-0 flex-1'>
            <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2'>
              <div>
                <h3 className='font-bold text-gray-900 text-lg break-words'>{commande.nomProduit}</h3>
                <div className='flex items-center gap-3 mt-1 flex-wrap'>
                  <span className='text-sm text-gray-400'>{formatDate(commande.createdAt)}</span>
                  <span className='text-sm text-gray-300'>{t.adminQuantityLabel} : {commande.quantite}</span>
                </div>
              </div>

              <div className='flex flex-col items-start sm:items-end gap-2'>
                <p className='text-lg font-bold text-gray-900'>
                  {formatMontant(commande.montantUnitaire * commande.quantite)}
                </p>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${status.bg} ${status.text} ${status.ring}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {commande.statut}
                </span>
              </div>
            </div>

            {commande.statut !== 'Annulée' && (
              <div className='mt-4 flex items-center gap-3'>
                <div className='relative h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden'>
                  <div
                    className='absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-300 to-sky-500 transition-all duration-700'
                    style={{ width: `${((stepLabels.indexOf(commande.statut) + 1) / stepLabels.length) * 100}%` }}
                  />
                </div>
                <span className='text-xs font-semibold text-gray-500 tabular-nums'>
                  {Math.round(((stepLabels.indexOf(commande.statut) + 1) / stepLabels.length) * 100)}%
                </span>
              </div>
            )}

            <div className='flex flex-wrap items-center gap-2 mt-4'>
              {actionError && <p role='alert' className='w-full text-sm text-red-600'>{actionError}</p>}
              {commande.statut === 'Préparation' && !commande.peutEtreModifiee && (
                <p className='w-full text-sm text-slate-500'>{t.clientOrderLocked}</p>
              )}
              {commande.peutEtreModifiee && (
                <div className='flex flex-wrap items-center gap-2'>
                  <label className='sr-only' htmlFor={`qty-${commande.id}`}>{t.adminQuantityLabel}</label>
                  <input id={`qty-${commande.id}`} type='number' min='1' max='1000' value={quantite} onChange={event => setQuantite(Math.max(1, Number(event.target.value) || 1))} className='w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm' disabled={saving} />
                  <button type='button' disabled={saving || quantite === commande.quantite} onClick={() => appliquerAction(() => onModify(commande.id, quantite))} className='inline-flex items-center gap-1 rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 disabled:opacity-40'><Pencil size={14} />{t.clientEditOrder}</button>
                  <button type='button' disabled={saving} onClick={() => appliquerAction(() => onCancel(commande))} className='inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 disabled:opacity-40'><Ban size={14} />{t.clientCancelOrder}</button>
                  <button type='button' disabled={saving} onClick={() => appliquerAction(() => onDelete(commande))} className='inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-40'><Trash2 size={14} />{t.clientDeleteOrder}</button>
                </div>
              )}
              {commande.statut === 'Livrée' && (
                <button
                  onClick={onLeaveReview}
                  className='flex items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 ring-1 ring-amber-200/50 transition hover:bg-amber-100 hover:shadow-sm cursor-pointer'
                >
                  <Star size={14} className='fill-amber-400 text-amber-400' />
                  {t.adminLeaveReviewTitle}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {commande.statut !== 'Annulée' && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className='w-full flex items-center justify-center gap-1 py-3 border-t border-gray-50 text-xs font-medium text-gray-400 transition hover:text-sky-500 hover:bg-gray-50/50'
          >
            {expanded ? t.adminHideTracking : t.adminViewDetailedTracking}
            <ChevronDown size={14} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </button>

          <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-40 px-6 pb-6' : 'max-h-0'}`}>
            <OrderTracker statut={commande.statut} />
          </div>
        </>
      )}
    </div>
  )
}

/* ───────── PAGE PRINCIPALE ───────── */
export default function MesCommandes () {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [commandes, setCommandes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [activeFilter, setActiveFilter] = useState('Toutes')
  const [produitFiltre, setProduitFiltre] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAvisModal, setShowAvisModal] = useState(false)

  async function rechargerCommandes () {
    if (user) setCommandes(await getMesDemandesProduits(user.id))
  }

  async function modifierCommande (id, quantite) {
    await modifierQuantiteDemande(id, quantite)
    await rechargerCommandes()
  }

  async function annulerCommande (commande) {
    if (!window.confirm(t.clientConfirmCancel)) return
    await annulerDemandeProduit(commande.id)
    await rechargerCommandes()
  }

  async function supprimerCommande (commande) {
    if (!window.confirm(t.clientConfirmDelete)) return
    await supprimerDemandeProduitClient(commande.id)
    await rechargerCommandes()
  }

  useEffect(() => {
    if (!user) return
    let annule = false
    getMesDemandesProduits(user.id)
      .then(data => {
        if (!annule) setCommandes(data)
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

  const filters = ['Toutes', 'Préparation', 'En cours', 'Livrée', 'Annulée']

  const filtered = commandes.filter(c => {
    const matchFilter = activeFilter === 'Toutes' || c.statut === activeFilter
    const matchProduit = !produitFiltre || c.nomProduit === produitFiltre
    const matchSearch = c.nomProduit.toLowerCase().includes(searchQuery.toLowerCase())
    return matchFilter && matchProduit && matchSearch
  })
  const produitsCommandes = [...new Set(commandes.map(c => c.nomProduit).filter(Boolean))]

  return (
    <section className='max-w-[1700px] mx-auto space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-extrabold text-gray-900'>{t.adminMyOrders}</h1>
          <p className='text-gray-500 mt-1'>{t.adminOrdersSubtitle}</p>
        </div>
      </div>

      {erreur && <p className='text-sm text-red-500'>{erreur}</p>}

      <QuickStats commandes={commandes} t={t} />

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

        <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row'>
          <label className='sr-only' htmlFor='filter-ordered-product'>{t.filterOrderedProduct}</label>
          <select
            id='filter-ordered-product'
            value={produitFiltre}
            onChange={e => setProduitFiltre(e.target.value)}
            className='w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-400/40 sm:w-52'
          >
            <option value=''>{t.allOrderedProducts}</option>
            {produitsCommandes.map(nom => <option key={nom} value={nom}>{nom}</option>)}
          </select>
          <div className='relative w-full sm:w-64'>
            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.adminSearchOrderPlaceholder}
              className='w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 transition'
            />
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        {chargement ? (
          <p className='text-center text-gray-400 py-12'>{t.loading}</p>
        ) : filtered.length > 0 ? (
          filtered.map(commande => (
            <OrderCard key={commande.id} commande={commande} onLeaveReview={() => setShowAvisModal(true)} onModify={modifierCommande} onCancel={annulerCommande} onDelete={supprimerCommande} t={t} />
          ))
        ) : (
          <div className='rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center'>
            <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-50'>
              <Package size={22} className='text-gray-300' />
            </div>
            <p className='mt-4 text-gray-500 font-medium'>{t.adminNoOrdersFound}</p>
            <p className='mt-1 text-sm text-gray-400'>{t.adminTryOtherFilter}</p>
          </div>
        )}
      </div>

      {showAvisModal && <AvisModal onClose={() => setShowAvisModal(false)} t={t} />}
    </section>
  )
}
