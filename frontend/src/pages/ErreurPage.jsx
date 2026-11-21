import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import logo from '../assets/chomatech-logo.png'

// Remplace l'écran technique de React Router ("Unexpected Application Error!") :
//  - notFound : adresse inconnue (route "*") ;
//  - sinon : erreur pendant l'affichage d'une page (errorElement), avec l'erreur en console.
export default function ErreurPage ({ notFound = false }) {
  const { t } = useLanguage()
  const erreur = useRouteError()
  const introuvable = notFound || (isRouteErrorResponse(erreur) && erreur.status === 404)

  if (erreur && !introuvable) {
    console.error(erreur)
  }

  return (
    <main className='flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center'>
      <img src={logo} alt='CHOMA TECH' className='h-20 w-20 object-contain' />
      <h1 className='text-3xl font-extrabold text-gray-900'>
        {introuvable ? t.notFoundTitle : t.errorTitle}
      </h1>
      <p className='max-w-md text-gray-500'>
        {introuvable ? t.notFoundDescription : t.errorDescription}
      </p>
      <div className='mt-2 flex flex-wrap justify-center gap-3'>
        {!introuvable && (
          <button
            type='button'
            onClick={() => window.location.reload()}
            className='rounded-xl border border-sky-500 px-5 py-2.5 font-semibold text-sky-600 transition hover:bg-sky-50 cursor-pointer'
          >
            {t.retry}
          </button>
        )}
        {/* Lien "dur" (rechargement complet) : après une erreur, l'état de l'app peut être incohérent. */}
        <a
          href='/'
          className='rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 px-5 py-2.5 font-semibold text-white'
        >
          {t.backHome}
        </a>
      </div>
    </main>
  )
}
