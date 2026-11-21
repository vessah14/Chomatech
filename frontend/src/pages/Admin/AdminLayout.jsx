import { useState, useEffect } from 'react'
import {
  Menu,
  Bell,
  PanelRightClose,
  ChevronDown
} from 'lucide-react'
import SideBarre from '../../Components/layout/Sidebar'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { getMesNotifications } from '../../api/notifications'

export default function AdminLayout () {
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth >= 1024
  )
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { language, toggleLanguage, t } = useLanguage()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [nbNotificationsNonLues, setNbNotificationsNonLues] = useState(0)

  function handleLogout () {
    logout()
    navigate('/', { replace: true })
  }

  useEffect(() => {
    if (!user) return
    let annule = false
    getMesNotifications(user.id)
      .then(notifs => {
        if (!annule) setNbNotificationsNonLues(notifs.filter(n => !n.lu).length)
      })
      .catch(() => {})
    return () => {
      annule = true
    }
  }, [user, location.pathname])

  return (
    <div className='admin-shell flex h-screen bg-gray-50'>
      <SideBarre
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* CONTENU PRINCIPAL */}
      <div className='min-w-0 flex-1 flex flex-col overflow-hidden'>
        {/* TOPBAR */}
        <header className='h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between gap-3 px-3 sm:px-6 shrink-0 sticky top-0 z-20'>
          {/* Gauche : Menu + Toggle + Recherche */}
          <div className='min-w-0 flex items-center gap-2 sm:gap-3'>
            {/* Burger mobile */}
            <button
              type='button'
              onClick={() => setIsSidebarOpen(current => !current)}
              aria-label={isSidebarOpen ? t.adminCloseMenu : t.adminOpenMenu}
              aria-expanded={isSidebarOpen}
              className='lg:hidden rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800'
            >
              <Menu size={22} />
            </button>

            {/* Toggle desktop */}
            <button
              onClick={() => setIsSidebarOpen(current => !current)}
              className='hidden lg:flex items-center rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600'
            >
              <PanelRightClose
                size={22}
                className={`transition-transform duration-300 ${
                  !isSidebarOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Droite : Actions + Profil */}
          <div className='flex shrink-0 items-center gap-2 sm:gap-3'>
            <button
              type='button'
              onClick={toggleLanguage}
              aria-label={t.adminLanguage}
              className='rounded-lg border border-sky-200 px-2 py-1 text-xs font-bold text-sky-700 transition hover:bg-sky-50'
            >
              {language === 'fr' ? 'EN' : 'FR'}
            </button>
            {/* Notifications */}
            <Link
              to='/admin/notification'
              className='relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800'
            >
              <Bell size={20} />
              {nbNotificationsNonLues > 0 && (
                <span className='absolute top-1.5 right-1.5 flex h-2 w-2'>
                  <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75' />
                  <span className='relative inline-flex h-2 w-2 rounded-full bg-red-500' />
                </span>
              )}
            </Link>

            {/* Séparateur */}
            <div className='hidden sm:block h-6 w-px bg-gray-200' />

            {/* Profil dropdown */}
            <div className='relative'>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className='flex items-center gap-2 rounded-xl p-1.5 pr-3 transition hover:bg-gray-100'
              >
            <div className='h-8 w-8 rounded-full bg-gradient-to-br from-sky-300 to-sky-600 flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-sky-200'>
                  {user?.prenom?.[0]?.toUpperCase() || '?'}
                </div>
                <div className='hidden sm:flex flex-col items-start'>
                  <span className='text-sm font-semibold text-gray-800'>
                    {user ? `${user.prenom} ${user.nom}` : t.adminMyAccount}
                  </span>
                  <span className='text-[10px] text-gray-400 leading-none'>
                    {user?.email}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`hidden sm:block text-gray-400 transition-transform duration-200 ${
                    isProfileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown menu */}
              {isProfileOpen && (
                <>
                  <div
                    className='fixed inset-0 z-30'
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className='absolute right-0 top-full mt-2 z-40 w-56 rounded-xl border border-gray-100 bg-white py-2 shadow-xl shadow-gray-200/50'>
                    <div className='px-4 py-2 border-b border-gray-100'>
                      <p className='text-sm font-semibold text-gray-800'>
                        {user ? `${user.prenom} ${user.nom}` : t.adminMyAccount}
                      </p>
                      <p className='text-xs text-gray-400'>
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      to='/admin/profil'
                      onClick={() => setIsProfileOpen(false)}
                      className='flex items-center gap-2 px-4 py-2 text-sm text-gray-600 transition hover:bg-sky-50 hover:text-sky-600'
                    >
                      {t.adminProfile}
                    </Link>
                    <Link
                      to='/admin/settings'
                      onClick={() => setIsProfileOpen(false)}
                      className='flex items-center gap-2 px-4 py-2 text-sm text-gray-600 transition hover:bg-sky-50 hover:text-sky-600'
                    >
                      {t.adminSettings}
                    </Link>
                    <div className='border-t border-gray-100 mt-1 pt-1'>
                      <button
                        type='button'
                        onClick={handleLogout}
                        className='flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 transition hover:bg-red-50 cursor-pointer'
                      >
                        {t.adminLogout}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* CONTENU DE LA PAGE */}
        <main className='min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-br from-sky-50/50 to-gray-50'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
