import { useState } from 'react'
import { Menu } from 'lucide-react'
import SideBarre from '../Components/layout/SideBarre'
import { Outlet } from 'react-router-dom'

export default function Layout () {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className='admin-shell min-h-screen bg-slate-100 flex'>
      {/* Sidebar avec état partagé : repliage desktop + ouverture mobile */}
      <SideBarre
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Marge dynamique ajustée selon le pliage : uniquement à partir de lg, la sidebar
          est hors-écran sur mobile donc aucune marge n'est nécessaire en dessous. */}
      <main
        id='admin-main'
        tabIndex='-1'
        className={`admin-main flex-1 min-w-0 p-4 sm:p-6 lg:p-8 transition-all duration-300 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Barre d'ouverture du menu, mobile uniquement */}
        <button
          type='button'
          onClick={() => setIsMobileOpen(true)}
          className='mb-4 flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm cursor-pointer lg:hidden'
        >
          <Menu className='w-4 h-4' />
          Menu
        </button>

        <Outlet />
      </main>
    </div>
  )
}
