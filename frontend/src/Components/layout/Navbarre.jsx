import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Button from '../ui/Button'
import '../../App.css'
import Panier from '../icon/Panier'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/chomatech-logo.png'

const navItems = [
  { key: 'home', path: '/' },
  { key: 'about', path: '/about' },
  { key: 'services', path: '/services' },
  { key: 'products', path: '/produits' },
  { key: 'portfolio', path: '/portfolio' },
  { key: 'Listings', path: '/Annonces' },
  { key: 'faq', path: '/faqContainer' },
  { key: 'contact', path: '/contact' }
]

function LanguageSwitcher ({ language, toggleLanguage }) {
  return (
    <button
      type='button'
      onClick={toggleLanguage}
      aria-label='Changer de langue'
      className='flex items-center gap-1 rounded-full border border-sky-200 p-1 text-xs font-semibold text-gray-500 transition hover:border-sky-300'
    >
      <span
        className={
          language === 'fr'
            ? 'rounded-full bg-gradient-to-r from-sky-600 to-sky-800 px-2 py-1 text-white'
            : 'px-2 py-1'
        }
      >
        FR
      </span>
      <span className='text-sky-300'>/</span>
      <span
        className={
          language === 'en'
            ? 'rounded-full bg-gradient-to-r from-sky-600 to-sky-800 px-2 py-1 text-white'
            : 'px-2 py-1'
        }
      >
        EN
      </span>
    </button>
  )
}

// Badge rond avec les initiales du client connectÃ© : mÃ¨ne directement Ã  son tableau de bord.
function AccountBadge ({ user, onClick }) {
  return (
    <Link
      to='/admin'
      onClick={onClick}
      title={`${user.prenom} ${user.nom}`}
      className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-sm font-bold text-white shadow-sm shadow-sky-200 transition hover:shadow-md'
    >
      {user.prenom?.[0]?.toUpperCase() || '?'}
    </Link>
  )
}

export default function Navbarre () {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const { language, t, toggleLanguage } = useLanguage()
  const { user, isAuthenticated } = useAuth()

  function goToAuthentication () {
    setIsMenuOpen(false)
    navigate('/authentification')
  }

  return (
    <nav className='public-nav sticky top-0 z-50 border-b shadow-sm backdrop-blur-xl'>
      <a href='#main-content' className='skip-link'>Aller au contenu principal</a>
      <div className='mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 md:px-6'>
        <Link to='/' className='flex'>
          <img
            src={logo}
            alt='CHOMA TECH'
            className='h-16 w-20 object-contain'
          />
        </Link>

        <ul className='hidden flex-wrap items-center justify-center gap-2 text-sm lg:flex lg:gap-4 xl:gap-5'>
          {navItems.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                    `border-b-2 py-2 text-sm font-medium transition-colors duration-200 xl:text-base ${
                    isActive
                      ? 'border-sky-500 font-semibold text-sky-700'
                      : 'border-transparent text-slate-600 hover:border-sky-200 hover:text-sky-700'
                  }`
                }
              >
                {t[item.key]}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className='hidden items-center gap-3 lg:flex'>
          <Panier />
          <LanguageSwitcher
            language={language}
            toggleLanguage={toggleLanguage}
          />
          {isAuthenticated ? (
            <AccountBadge user={user} />
          ) : (
            <>
              <Button
                onClick={goToAuthentication}
                className='border-2 rounded-2xl border-[#0ea4e8] bg-gradient-to-r from-sky-600 to-sky-800 bg-clip-text px-4 py-2 text-sm font-semibold text-transparent transition hover:bg-[var(--btn-hover)] hover:bg-clip-border hover:text-white md:text-base'
              >
                {t.login}
              </Button>
              <Button
                onClick={() => { setIsMenuOpen(false); navigate('/contact') }}
                className='bg-gradient-to-r from-sky-600 to-sky-800 px-4 py-2 text-sm font-semibold text-white transition hover:from-sky-700 hover:to-sky-900 md:text-base'
              >
                {t.start}
              </Button>
            </>
          )}
        </div>

        <div className='flex items-center gap-3 lg:hidden'>
          <Panier />
          <button
            type='button'
            aria-label='Ouvrir le menu'
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className='flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 shadow-sm'
          >
            <span
              className={`block h-0.5 w-5 rounded-full bg-current transition-all ${
                isMenuOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-current transition-all ${
                isMenuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-current transition-all ${
                isMenuOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isMenuOpen && (
          <motion.div
            key='mobile-navigation'
            className='flex flex-col gap-3 px-4 pb-4 lg:hidden'
            initial={reduceMotion ? false : { opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {navItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.025, duration: 0.18 }}
              >
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `block rounded-xl px-3 py-3 font-medium transition ${isActive ? 'bg-sky-100 text-sky-800' : 'bg-sky-50 text-gray-700 hover:text-[var(--btn-color)]'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t[item.key]}
                </NavLink>
              </motion.div>
            ))}
            <div className='flex flex-col gap-3 pt-2'>
              <LanguageSwitcher
              language={language}
              toggleLanguage={toggleLanguage}
            />
            {isAuthenticated ? (
              <AccountBadge user={user} onClick={() => setIsMenuOpen(false)} />
            ) : (
              <>
                <Button
                  onClick={goToAuthentication}
                  className='border-2 border-[#0ea4e8] bg-gradient-to-r from-sky-600 to-sky-800 bg-clip-text px-4 py-2 text-sm font-semibold text-transparent transition hover:bg-[var(--btn-hover)] hover:bg-clip-border hover:text-white'
                >
                  {t.login}
                </Button>
                <Button
                  onClick={() => { setIsMenuOpen(false); navigate('/contact') }}
                  className='bg-gradient-to-r from-sky-600 to-sky-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--btn-hover)]'
                >
                  {t.start}
                </Button>
              </>
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

