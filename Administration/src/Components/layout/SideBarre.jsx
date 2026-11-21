import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/chomatech-logo.png'
import {
  ChartColumnIncreasing,
  ShoppingCart,
  Package,
  Users,
  HandPlatter,
  Volume2,
  MessagesSquare,
  BellRing,
  TableOfContents,
  Star,
  HandCoins,
  Settings,
  PanelLeft,
  LogOut,
  Briefcase,
  Mail,
  Newspaper,
  Bot,
  X
} from 'lucide-react'

// Accepte des props pour contrôler la largeur (desktop) et la visibilité (mobile) depuis le Layout
export default function SideBarre ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout () {
    logout()
    navigate('/login', { replace: true })
  }

  const nomComplet = user ? `${user.prenom} ${user.nom}` : 'Administrateur'

  const links = [
    { path: '/admin', icon: ChartColumnIncreasing, name: "Vue d'ensemble" },
    { path: '/admin/commandes', icon: ShoppingCart, name: 'Commandes'},
    { path: '/admin/produits', icon: Package, name: 'Produits' },
    { path: '/admin/clients', icon: Users, name: 'Clients' },
    { path: '/admin/services', icon: HandPlatter, name: 'Services' },
    { path: '/admin/annonces', icon: Volume2, name: 'Annonces' },
    { path: '/admin/realisations', icon: Briefcase, name: 'Réalisations' },
    { path: '/admin/messages-contact', icon: Mail, name: 'Messages de contact' },
    { path: '/admin/newsletter', icon: Newspaper, name: 'Newsletter' },
    { path: '/admin/chatbot', icon: Bot, name: 'Base chatbot' },
    { path: '/admin/messagerie', icon: MessagesSquare, name: 'Messagerie' },
    { path: '/admin/notification', icon: BellRing, name: 'Notifications' },
    { path: '/admin/faq', icon: TableOfContents, name: 'FAQ' },
    { path: '/admin/avis', icon: Star, name: 'Avis clients' },
    { path: '/admin/paiements', icon: HandCoins, name: 'Paiements' },
    { path: '/admin/parametres', icon: Settings, name: 'Paramètres' }
  ]

  return (
    <>
      {/* Rideau mobile : ferme le menu au clic en dehors, absent sur desktop */}
      {isMobileOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden'
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen bg-ink-900 text-white flex flex-col justify-between p-4 z-50 shadow-xl transition-all duration-300 w-64 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Fermer (mobile uniquement) */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className='absolute -right-3 top-6 bg-ink-800 border border-sky-800 p-1.5 rounded-full text-blue-200 hover:text-white hover:bg-sky-900 transition-colors shadow-md cursor-pointer lg:hidden'
        >
          <X className='w-4 h-4' />
        </button>

        {/* Bouton Toggle (desktop uniquement) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className='hidden lg:flex absolute -right-3 top-6 bg-ink-800 border border-sky-800 p-1.5 rounded-full text-blue-200 hover:text-white hover:bg-sky-900 transition-colors shadow-md cursor-pointer'
          title={isCollapsed ? 'Déplier' : 'Réduire'}
        >
          <PanelLeft className='w-4 h-4' />
        </button>

        {/* Header */}
        <div className='flex items-center space-x-3 pb-6 border-b border-sky-900/60 overflow-hidden'>
          {/* Logo sur pastille blanche : le logo a un fond clair, illisible directement sur le bleu nuit */}
          <div className='w-10 h-10 min-w-10 rounded-full bg-white p-0.5 shadow-md'>
            <img src={logo} alt='CHOMA TECH' className='h-full w-full object-contain' />
          </div>
          <div className={`truncate ${isCollapsed ? 'lg:hidden' : ''}`}>
            <h2 className='font-semibold text-sm leading-tight truncate'>
              {nomComplet}
            </h2>
            <span className='text-xs text-sky-400 font-medium tracking-wide block truncate'>
              CHOMA TECH
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className='flex-1 my-6 overflow-y-auto pr-1 custom-scrollbar'>
          <ul className='space-y-1.5'>
            {links.map(link => {
              const IconComponent = link.icon
              return (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    end={link.path === '/admin'} // Évite que "Vue d'ensemble" reste toujours actif
                    title={isCollapsed ? link.name : ''}
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) =>
                      `w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 gap-4 ${
                        isCollapsed ? 'lg:justify-center lg:gap-0' : ''
                      } ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-lg shadow-blue-600/30'
                          : 'text-blue-200 hover:bg-ink-800/50 hover:text-white'
                      }`
                    }
                  >
                    <IconComponent className='w-5 h-5 min-w-5' />
                    <span className={`truncate ${isCollapsed ? 'lg:hidden' : ''}`}>{link.name}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Déconnexion */}
        <div className='pt-4 border-t border-sky-900/60'>
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Déconnexion' : ''}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors gap-4 ${
              isCollapsed ? 'lg:justify-center lg:gap-0' : ''
            }`}
          >
            <LogOut className='w-5 h-5 min-w-5' />
            <span className={isCollapsed ? 'lg:hidden' : ''}>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  )
}
