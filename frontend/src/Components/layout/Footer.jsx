import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useParametres } from '../../api/parametres'
import { getProduits } from '../../api/produits'
import { getServices } from '../../api/services'
import logo from '../../assets/chomatech-logo.png'

// Chaque entrÃ©e mÃ¨ne Ã  une vraie page (auparavant : href='#', liens morts).
const reseauxSociaux = [
  { lettre: 'F', nom: 'Facebook', url: '' },
  { lettre: 'T', nom: 'TikTok', url: '' },
  { lettre: 'L', nom: 'LinkedIn', url: '' },
  { lettre: 'I', nom: 'Instagram', url: '' }
].filter(r => r.url)

export default function Footer () {
  const { t } = useLanguage()
  // CoordonnÃ©es modifiables dans l'admin (ParamÃ¨tres) ; valeurs statiques en attendant.
  const parametres = useParametres()
  const [services, setServices] = useState([])
  const [categoriesProduits, setCategoriesProduits] = useState([])

  useEffect(() => {
    let annule = false
    getServices()
      .then(data => {
        if (!annule) setServices(data.filter(service => service.statut === 'Actif'))
      })
      .catch(() => {})
    getProduits()
      .then(data => {
        if (annule) return
        setCategoriesProduits([...new Set(data
          .filter(produit => produit.statut !== 'ArchivÃ©')
          .map(produit => produit.categorie)
          .filter(Boolean))])
      })
      .catch(() => {})
    return () => { annule = true }
  }, [])

  return (
    <footer className='site-footer bg-[#0a0f1e] text-white border-t border-sky-500'>
      <div className='max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10'>
        {/* Colonne 1 â€” Logo + description */}
        <div>
          <img
            src={logo}
            alt='ChomaTech'
            className='mb-4 h-20 w-20 rounded-2xl bg-white p-1 object-contain'
          />

          <p className='text-sm text-gray-400 leading-relaxed mb-4'>
            {t.footerDescription}
          </p>

          <p className='text-sm italic text-sky-400 mb-5'>
            ðŸš€{' '}
            <span className='underline underline-offset-2'>
              {t.footerSlogan}
            </span>
          </p>

          {reseauxSociaux.length > 0 && (
            <div className='flex gap-2'>
              {reseauxSociaux.map(r => (
                <a
                  key={r.nom}
                  href={r.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={r.nom}
                  title={r.nom}
                  className='flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-sm font-semibold text-gray-300 hover:bg-sky-500 hover:text-white transition'
                >
                  {r.lettre}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Colonne 2 â€” Services */}
        <div>
          <h4 className='text-xs font-bold tracking-widest text-white mb-4'>
            {t.servicesHeading}
          </h4>
          <ul className='space-y-3'>
            {services.map(service => (
              <li key={service.id}>
                <Link to={`/Services/${service.id}`} className='text-sm text-gray-400 hover:text-sky-400 transition'>
                  {service.nomService}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne 3 â€” Boutique */}
        <div>
          <h4 className='text-xs font-bold tracking-widest text-white mb-4'>
            {t.shopHeading}
          </h4>
          <ul className='space-y-3'>
            {categoriesProduits.map(categorie => (
              <li key={categorie}>
                <Link to={`/Produits?categorie=${encodeURIComponent(categorie)}`} className='text-sm text-gray-400 hover:text-sky-400 transition'>
                  {categorie}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne 4 â€” Contact */}
        <div>
          <h4 className='text-xs font-bold tracking-widest text-white mb-4'>
            {t.contactHeading}
          </h4>
          <ul className='space-y-4'>
            <li className='flex items-start gap-3 text-sm text-gray-400'>
              <MapPin size={16} className='text-sky-400 mt-0.5 shrink-0' />
              <span className='whitespace-pre-line'>
                {parametres?.adresse ?? 'Douala, Cameroun\nAvenue des Nations Unies'}
              </span>
            </li>
            <li className='flex items-center gap-3 text-sm text-gray-400'>
              <Phone size={16} className='text-sky-400 shrink-0' />
              {parametres?.telephone ?? '+237 6XX XXX XXX'}
            </li>
            <li className='flex items-center gap-3 text-sm text-gray-400'>
              <Mail size={16} className='text-sky-400 shrink-0' />
              {parametres?.email ?? 'contact@chomatech.cm'}
            </li>
            <li className='flex items-center gap-3 text-sm text-gray-400'>
              <Clock size={16} className='text-gray-400 shrink-0' />
              {t.weekdays} Â· 8hâ€“18h, {t.saturday} Â· 9hâ€“16h
            </li>
            <li className='flex items-center gap-2 pt-1'>
              <span className='flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400'>
                <span className='h-2 w-2 rounded-full bg-emerald-400'></span>
                {t.online}
              </span>
              <span className='text-xs text-gray-500'>
                {t.supportAvailable}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Barre du bas */}
      <div className='border-t border-slate-800'>
        <div className='max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4'>
          <p className='text-sm text-gray-500'>
            Â© {new Date().getFullYear()} CHOMA TECH Â· {t.allRights}
          </p>
          {/* Liens "ConfidentialitÃ©" / "CGV" retirÃ©s tant que ces pages n'existent pas
              (ils menaient Ã  "#"). Ã€ rÃ©tablir avec de vraies pages lÃ©gales. */}
        </div>
      </div>
    </footer>
  )
}



