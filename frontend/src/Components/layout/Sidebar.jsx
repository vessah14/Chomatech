import { useEffect, useState } from 'react'
import {
  Home,
  Users,
  HandPlatter,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  BellRing,
  MessagesSquare,
  Star,
  X,
  ChevronLeft,
  ArrowLeft
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../../assets/chomatech-logo.png'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { getMesConversations } from '../../api/conversations'
import { getMesNotifications } from '../../api/notifications'

export default function SideBarre ({ isSidebarOpen, setIsSidebarOpen }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user, logout } = useAuth()

  const [nbMessagesNonLus, setNbMessagesNonLus] = useState(0)
  const [nbNotificationsNonLues, setNbNotificationsNonLues] = useState(0)

  useEffect(() => {
    if (!user) return
    let annule = false

    getMesConversations(user.id)
      .then(convs => {
        if (annule) return
        const messages = convs[0]?.messages || []
        setNbMessagesNonLus(messages.filter(m => m.sender === 'admin' && !m.lu).length)
      })
      .catch(() => {})

    getMesNotifications(user.id)
      .then(notifs => {
        if (!annule) setNbNotificationsNonLues(notifs.filter(n => !n.lu).length)
      })
      .catch(() => {})

    return () => {
      annule = true
    }
  }, [user, location.pathname])

  const menuItems = [
    { labelKey: 'adminDashboard', icon: Home, path: '/admin' },
    { labelKey: 'adminOrders', icon: Package, path: '/admin/commandes' },
    { labelKey: 'adminCart', icon: ShoppingCart, path: '/admin/panier' },
    { labelKey: 'adminServices', icon: HandPlatter, path: '/admin/services' },
    {
      labelKey: 'adminMessages',
      icon: MessagesSquare,
      path: '/admin/messages',
      badge: nbMessagesNonLus || null
    },
    {
      labelKey: 'adminNotifications',
      icon: BellRing,
      path: '/admin/notification',
      badge: nbNotificationsNonLues || null
    },
    { labelKey: 'adminReviews', icon: Star, path: '/admin/avis' },
    { labelKey: 'adminProfile', icon: Users, path: '/admin/profil' },
    { labelKey: 'adminSettings', icon: Settings, path: '/admin/settings' }
  ]

  function handleLogout () {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <>
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className='fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden'
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-100 bg-white shadow-xl transition-all duration-300 ease-in-out lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${
          isSidebarOpen
            ? 'w-72 translate-x-0'
            : '-translate-x-full lg:w-20 lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className='flex h-16 items-center gap-3 border-b border-gray-100 px-4'>
          <img
            src={logo}
            alt='ChomaTech'
            className='h-11 w-11 shrink-0 rounded-xl object-contain'
          />
          {isSidebarOpen && (
            <div className='flex flex-col'>
              <span className='text-sm font-bold text-gray-800 tracking-wide'>
                CHOMA TECH
              </span>
              <span className='text-[10px] text-gray-400'>{t.adminClientSpace}</span>
            </div>
          )}

          {/* Fermer mobile */}
          <button
            type='button'
            onClick={() => setIsSidebarOpen(false)}
            className='ml-auto rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 lg:hidden'
          >
            <X size={20} />
          </button>

          {/* Toggle desktop */}
          <button
            type='button'
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className='ml-auto hidden rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 lg:flex'
          >
            <ChevronLeft
              size={18}
              className={`transition-transform duration-300 ${
                !isSidebarOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className='flex flex-1 flex-col gap-1 overflow-y-auto p-3 mt-2'>
          {menuItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                  ? 'bg-gradient-to-r from-sky-400 to-sky-600 text-white shadow-md shadow-sky-200'
                    : 'text-gray-600 hover:bg-sky-50 hover:text-sky-600'
                } ${!isSidebarOpen ? 'lg:justify-center lg:px-0' : ''}`}
              >
                <Icon
                  size={20}
                  className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : ''
                  }`}
                />
                {isSidebarOpen && (
                  <span className='whitespace-nowrap'>{t[item.labelKey]}</span>
                )}

                {/* Badge */}
                {item.badge && (
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-red-500 text-white'
                    } ${
                      isSidebarOpen ? 'ml-auto' : 'absolute -right-1 -top-1'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip quand fermé */}
                {!isSidebarOpen && (
                  <span className='pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block'>
                    {t[item.labelKey]}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Profil + Déconnexion */}
        <div className='border-t border-gray-100 p-3'>
          {/* Mini profil */}
          {isSidebarOpen && (
            <div className='mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 to-sky-500 text-xs font-bold text-white'>
                {user?.prenom?.[0]?.toUpperCase() || '?'}
              </div>
              <div className='flex flex-col min-w-0'>
                <span className='text-sm font-semibold text-gray-800 truncate'>
                  {user ? `${user.prenom} ${user.nom}` : t.adminMyAccount}
                </span>
                <span className='text-[11px] text-gray-400 truncate'>
                  {user?.email}
                </span>
              </div>
            </div>
          )}

          {/* Retour au site public, sans se déconnecter */}
          <Link
            to='/'
            title={!isSidebarOpen ? t.backHome : undefined}
            className={`group mb-2 flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 py-2.5 text-sky-600 transition-all duration-200 hover:border-sky-300 hover:bg-sky-100 hover:shadow-sm ${
              isSidebarOpen ? 'w-full px-4' : 'mx-auto h-10 w-10'
            }`}
          >
            <ArrowLeft
              size={18}
              className='shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5'
            />
            {isSidebarOpen && (
              <span className='text-sm font-semibold'>{t.backHome}</span>
            )}
          </Link>

          {/* Bouton déconnexion */}
          <button
            type='button'
            onClick={handleLogout}
            className={`group flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-red-500 transition-all duration-200 hover:border-red-300 hover:bg-red-100 hover:shadow-sm cursor-pointer ${
              isSidebarOpen ? 'w-full px-4' : 'mx-auto h-10 w-10'
            }`}
          >
            <LogOut
              size={18}
              className='shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5'
            />
            {isSidebarOpen && (
              <span className='text-sm font-semibold'>{t.adminLogout}</span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
