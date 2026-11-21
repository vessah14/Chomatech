import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPaiementStatut } from '../api/paiements'

export default function RetourPaiementPage () {
  const [searchParams] = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const [statut, setStatut] = useState(() => paymentId ? 'loading' : 'error')
  const [message, setMessage] = useState(() => paymentId ? 'Verification du paiement...' : 'Aucun identifiant de paiement fourni.')

  useEffect(() => {
    if (!paymentId) return

    let isCancelled = false

    const verifier = async () => {
      try {
        const result = await getPaiementStatut(paymentId)
        if (isCancelled) return

        if (result?.statut === 'PAID') {
          setStatut('success')
          setMessage(
            'Paiement validÃ© avec succÃ¨s. Votre commande est maintenant confirmÃ©e.'
          )
          return
        }

        if (
          result?.statut === 'FAILED' ||
          result?.statut === 'CANCELLED' ||
          result?.statut === 'EXPIRED'
        ) {
          setStatut('error')
          setMessage(
            'Le paiement nâ€™a pas Ã©tÃ© finalisÃ©. Vous pouvez rÃ©essayer ou contacter le support.'
          )
          return
        }

        setStatut('pending')
        setMessage(
          'Le paiement est en cours de validation. Veuillez patienter...'
        )
        window.setTimeout(verifier, 4000)
      } catch (error) {
        if (isCancelled) return
        setStatut('error')
        setMessage(
          error.message || 'Impossible de vÃ©rifier le statut du paiement.'
        )
      }
    }

    verifier()

    return () => {
      isCancelled = true
    }
  }, [paymentId])

  const contentMap = {
    loading: {
      title: 'Paiement en cours',
      accent: 'text-sky-700',
      card: 'border-sky-200 bg-sky-50'
    },
    pending: {
      title: 'Paiement en attente',
      accent: 'text-amber-700',
      card: 'border-amber-200 bg-amber-50'
    },
    success: {
      title: 'Paiement rÃ©ussi',
      accent: 'text-emerald-700',
      card: 'border-emerald-200 bg-emerald-50'
    },
    error: {
      title: 'Paiement non finalisÃ©',
      accent: 'text-red-700',
      card: 'border-red-200 bg-red-50'
    }
  }

  const content = contentMap[statut] || contentMap.loading

  return (
    <main className='themed-page min-h-screen px-4 py-16'>
      <div className='mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm'>
        <div className={`rounded-2xl border p-6 ${content.card}`}>
          <p
            className={`text-sm font-bold uppercase tracking-[0.18em] ${content.accent}`}
          >
            Paiement
          </p>
          <h1 className='mt-3 text-3xl font-bold text-slate-900'>
            {content.title}
          </h1>
          <p className='mt-3 text-sm leading-6 text-slate-700'>{message}</p>
        </div>

        <div className='mt-6 flex flex-col gap-3 sm:flex-row'>
          <Link
            to='/'
            className='inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 font-bold text-white transition hover:bg-sky-700'
          >
            Retour Ã  lâ€™accueil
          </Link>
          <Link
            to='/compte/commandes'
            className='inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50'
          >
            Voir mes commandes
          </Link>
        </div>
      </div>
    </main>
  )
}

