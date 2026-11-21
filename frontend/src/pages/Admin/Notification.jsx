import { useEffect, useState } from 'react'
import { Package, Check, Bell, Megaphone, Filter, CheckCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { getMesNotifications, marquerNotificationLue } from '../../api/notifications'

const iconParType = {
  Commande: { icon: Package, bg: 'bg-amber-50', color: 'text-amber-500' },
  Promo: { icon: Bell, bg: 'bg-sky-50', color: 'text-sky-500' },
  Annonce: { icon: Megaphone, bg: 'bg-sky-50', color: 'text-sky-500' },
  Statut: { icon: Check, bg: 'bg-emerald-50', color: 'text-emerald-500' },
  Autre: { icon: Bell, bg: 'bg-gray-50', color: 'text-gray-500' }
}

// 'Commande'/'Annonce'/'Promo' restent en français : ce sont les valeurs réelles du champ
// Type stocké en base (même vocabulaire que côté admin), pas du texte d'interface à traduire.
function useFiltres (t) {
  return [
    { label: t.adminAllFilter, value: 'all' },
    { label: t.adminUnreadLabel, value: 'unread' },
    { label: 'Commande', value: 'Commande' },
    { label: 'Annonce', value: 'Annonce' },
    { label: 'Promo', value: 'Promo' }
  ]
}

function tempsRelatif (iso, t) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const heures = Math.floor(diffMs / 3_600_000)
  if (heures < 1) return t.adminTimeJustNow
  if (heures < 24) return t.adminTimeHoursAgo.replace('{n}', heures)
  const jours = Math.floor(heures / 24)
  return jours === 1 ? t.adminTimeYesterday : t.adminTimeDaysAgo.replace('{n}', jours)
}

/* ───────── NOTIFICATION CARD ───────── */
function NotificationCard ({ notification, onRead, t }) {
  const config = iconParType[notification.type] || iconParType.Autre
  const Icon = config.icon

  return (
    <div
      className={`group relative rounded-2xl border bg-white p-5 flex items-start gap-4 transition-all duration-300 hover:shadow-md ${
        !notification.lu ? 'border-sky-200/70 bg-sky-50/30' : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      {!notification.lu && (
        <div className='absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-sky-500' />
      )}

      <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${config.bg} transition-transform group-hover:scale-105`}>
        <Icon className={`w-5 h-5 ${config.color}`} strokeWidth={2} />
      </div>

      <div className='flex-1 min-w-0'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0'>
            <p className={`font-semibold break-words ${!notification.lu ? 'text-gray-900' : 'text-gray-700'}`}>
              {notification.titre}
            </p>
            <p className='text-sm text-gray-500 mt-0.5 break-words leading-relaxed'>
              {notification.message}
            </p>
          </div>

          {!notification.lu && (
            <button
              onClick={() => onRead(notification.id)}
              className='shrink-0 rounded-lg p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 transition hover:bg-gray-100 hover:text-gray-600'
              title={t.adminMarkAsRead}
            >
              <CheckCheck size={16} />
            </button>
          )}
        </div>

        <span className='text-xs text-gray-400 mt-3 block'>{tempsRelatif(notification.createdAt, t)}</span>
      </div>
    </div>
  )
}

/* ───────── PAGE PRINCIPALE ───────── */
export default function Notifications () {
  const { user } = useAuth()
  const { t } = useLanguage()
  const filters = useFiltres(t)
  const [notifications, setNotifications] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    if (!user) return
    let annule = false
    getMesNotifications(user.id)
      .then(data => {
        if (!annule) setNotifications(data)
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

  const unreadCount = notifications.filter(n => !n.lu).length

  const filtered = notifications.filter(n => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'unread') return !n.lu
    return n.type === activeFilter
  })

  const markAsRead = async id => {
    try {
      await marquerNotificationLue(id)
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, lu: true } : n)))
    } catch (err) {
      window.alert(err.message)
    }
  }

  const markAllRead = async () => {
    const nonLues = notifications.filter(n => !n.lu)
    try {
      await Promise.all(nonLues.map(n => marquerNotificationLue(n.id)))
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <div className='max-w-[1700px] mx-auto space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3'>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-extrabold text-gray-900'>{t.adminNotifications}</h1>
            {unreadCount > 0 && (
              <span className='flex h-7 min-w-7 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white'>
                {unreadCount}
              </span>
            )}
          </div>
          <p className='text-gray-500 mt-1'>{t.adminNotificationsSubtitle}</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className='self-start sm:self-auto flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:border-gray-300'
          >
            <CheckCheck size={16} />
            {t.adminMarkAllRead}
          </button>
        )}
      </div>

      {erreur && <p className='text-sm text-red-500'>{erreur}</p>}

      <div className='grid grid-cols-3 gap-3'>
        <div className='rounded-xl bg-white border border-gray-100 p-4 text-center'>
          <p className='text-2xl font-bold text-gray-900'>{notifications.length}</p>
          <p className='text-xs text-gray-400 font-medium mt-0.5'>{t.adminStatTotal}</p>
        </div>
        <div className='rounded-xl bg-white border border-gray-100 p-4 text-center'>
          <p className='text-2xl font-bold text-sky-600'>{unreadCount}</p>
          <p className='text-xs text-gray-400 font-medium mt-0.5'>{t.adminUnreadLabel}</p>
        </div>
        <div className='rounded-xl bg-white border border-gray-100 p-4 text-center'>
          <p className='text-2xl font-bold text-emerald-600'>{notifications.length - unreadCount}</p>
          <p className='text-xs text-gray-400 font-medium mt-0.5'>{t.adminReadLabel}</p>
        </div>
      </div>

      <div className='flex items-center gap-2 overflow-x-auto pb-1'>
        <Filter size={16} className='text-gray-400 shrink-0' />
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              activeFilter === f.value ? 'bg-sky-500 text-white shadow-sm shadow-sky-200' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {f.label}
            {f.value === 'unread' && unreadCount > 0 && (
              <span
                className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  activeFilter === 'unread' ? 'bg-white/25 text-white' : 'bg-sky-100 text-sky-600'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className='flex flex-col gap-3'>
        {chargement ? (
          <p className='text-center text-gray-400 py-12'>{t.loading}</p>
        ) : filtered.length > 0 ? (
          filtered.map(n => <NotificationCard key={n.id} notification={n} onRead={markAsRead} t={t} />)
        ) : (
          <div className='rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center'>
            <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-50'>
              <Bell size={22} className='text-gray-300' />
            </div>
            <p className='mt-4 text-gray-500 font-medium'>{t.adminNoNotifications}</p>
            <p className='mt-1 text-sm text-gray-400'>
              {activeFilter === 'unread' ? t.adminAllCaughtUp : t.adminNothingForFilter}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
