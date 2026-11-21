import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import logo from '../assets/chomatech-logo.png'

// Remplace l'écran technique de React Router ("Unexpected Application Error!") :
//  - notFound : adresse inconnue (route "*") ;
//  - sinon : erreur pendant l'affichage d'une page (errorElement), avec l'erreur en console.
export default function ErreurPage ({ notFound = false }) {
  const erreur = useRouteError()
  const introuvable = notFound || (isRouteErrorResponse(erreur) && erreur.status === 404)

  if (erreur && !introuvable) {
    console.error(erreur)
  }

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center'>
      <img src={logo} alt='CHOMA TECH' className='h-20 w-20 object-contain' />
      <h1 className='text-2xl font-bold text-slate-800'>
        {introuvable ? 'Page introuvable' : 'Une erreur est survenue'}
      </h1>
      <p className='max-w-md text-sm text-slate-500'>
        {introuvable
          ? "Cette page n'existe pas dans l'administration."
          : "La page n'a pas pu s'afficher. Réessayez ; si le problème persiste, notez l'action effectuée."}
      </p>
      <div className='mt-2 flex gap-3'>
        {!introuvable && (
          <button
            type='button'
            onClick={() => window.location.reload()}
            className='cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100'
          >
            Réessayer
          </button>
        )}
        {/* Lien "dur" (rechargement complet) : après une erreur, l'état de l'app peut être incohérent. */}
        <a href='/admin' className='rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700'>
          Retour au tableau de bord
        </a>
      </div>
    </main>
  )
}
