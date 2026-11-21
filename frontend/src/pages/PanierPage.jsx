import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getProduits } from '../api/produits'
import { demarrerPaiementPanier } from '../api/paiements'
import { formatPrixFcfa } from '../utils/format'
import { resolveMediaUrl } from '../api/client'

export default function PanierPage () {
  const {
    cart,
    total,
    updateQuantity,
    removeFromCart,
    clearCart,
    synchroniserAvecCatalogue
  } = useCart()
  const { t } = useLanguage()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [confirmation, setConfirmation] = useState(false)
  const [notificationCommande, setNotificationCommande] = useState(false)
  const [erreur, setErreur] = useState('')
  const [changements, setChangements] = useState([])

  useEffect(() => {
    if (!notificationCommande) return undefined
    const timer = window.setTimeout(() => setNotificationCommande(false), 6000)
    return () => window.clearTimeout(timer)
  }, [notificationCommande])

  // Recale le panier (prix, disponibilitÃ©, stock) sur le catalogue actuel. Renvoie true si le
  // panier a changÃ©, pour que le client voie les nouvelles conditions avant de commander.
  const verifierPanier = async () => {
    const produits = await getProduits()
    const diff = synchroniserAvecCatalogue(produits)
    setChangements(diff)
    return diff.length > 0
  }

  useEffect(() => {
    // Au chargement uniquement ; une erreur rÃ©seau ici ne doit pas bloquer l'affichage du panier.
    let annule = false
    getProduits()
      .then(produits => {
        if (!annule) setChangements(synchroniserAvecCatalogue(produits))
      })
      .catch(() => {})
    return () => {
      annule = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const confirmerCommande = async () => {
    if (!isAuthenticated) {
      navigate('/authentification', { state: { from: '/panier' } })
      return
    }

    if (!cart.length) {
      setErreur('Votre panier est vide.')
      return
    }

    setConfirmation(true)
    setErreur('')
    try {
      if (await verifierPanier()) return

      const requestKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`

      const paiement = await demarrerPaiementPanier({
        requestKey,
        commande: {
          lignes: cart.map(item => ({
            produitId: item.id,
            quantite: item.quantity
          }))
        }
      })

      if (paiement?.checkoutUrl) {
        clearCart()
        window.location.href = paiement.checkoutUrl
        return
      }

      setErreur('Le paiement nâ€™a pas Ã©tÃ© dÃ©marrÃ©. Veuillez rÃ©essayer.')
    } catch (err) {
      setErreur(
        err?.message ||
          'Une erreur inattendue est survenue pendant le paiement.'
      )
    } finally {
      setConfirmation(false)
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className='themed-page min-h-screen px-4 py-10 sm:py-16'
    >
      {notificationCommande && (
        <div
          role='status'
          aria-live='polite'
          className='fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-md animate-[toast-in_250ms_ease-out] rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl shadow-slate-900/15 sm:right-6 sm:top-6'
        >
          <div className='flex items-start gap-3'>
            <div className='mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600'>
              <Check size={19} strokeWidth={2.5} />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='font-bold text-slate-900'>{t.orderReceivedTitle}</p>
              <p className='mt-1 text-sm leading-5 text-slate-600'>
                {t.orderFollowUpMessage}
              </p>
              <Link
                to='/compte/commandes'
                className='mt-2 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-800'
              >
                {t.viewMyOrders}
              </Link>
            </div>
          </div>
          <div className='absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-2xl bg-emerald-50'>
            <div className='h-full origin-left animate-[toast-progress_6s_linear_forwards] bg-emerald-500' />
          </div>
        </div>
      )}
      <div className='mx-auto max-w-6xl'>
        <div className='mb-10'>
          <p className='text-sm font-bold uppercase tracking-[0.2em] text-sky-600'>
            CHOMA TECH
          </p>
          <h1 className='mt-2 text-3xl font-bold text-gray-950 sm:text-4xl'>
            {t.cartTitle}
          </h1>
          <p className='mt-3 text-gray-500'>{t.cartDescription}</p>
        </div>

        {cart.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className='grid gap-8 lg:grid-cols-[1.2fr_0.8fr]'>
            <section className='space-y-4'>
              {cart.map(item => (
                <article
                  key={item.id}
                  className='flex flex-col gap-4 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center'
                >
                  <img
                    src={resolveMediaUrl(item.image)}
                    alt={item.tittle}
                    className='h-28 w-full rounded-xl bg-sky-50 object-contain sm:w-32'
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='text-xs font-bold uppercase tracking-wider text-sky-600'>
                      {item.type}
                    </p>
                    <h2 className='mt-1 truncate text-lg font-bold text-gray-900'>
                      {item.tittle}
                    </h2>
                    {item.available === false && (
                      <p className='mt-1 text-sm font-medium text-red-600'>{t.cartUnavailable}</p>
                    )}
                    <p className='mt-1 font-bold text-sky-600'>
                      {item.priceLabel || formatPrixFcfa(item.price)}
                    </p>
                  </div>
                  <div className='flex items-center justify-between gap-4'>
                    <div className='flex h-10 items-center gap-4 rounded-xl border border-sky-100 bg-sky-50 px-3'>
                      <button
                        type='button'
                        aria-label={t.decreaseQuantity}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus size={15} />
                      </button>
                      <span className='font-bold'>{item.quantity}</span>
                      <button
                        type='button'
                        aria-label={t.increaseQuantity}
                        disabled={item.available === false}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className='disabled:cursor-not-allowed disabled:opacity-40'
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <button
                      type='button'
                      aria-label={`${t.removeProduct} ${item.tittle}`}
                      onClick={() => removeFromCart(item.id)}
                      className='text-gray-400 transition hover:text-red-500'
                    >
                      <Trash2 size={19} />
                    </button>
                  </div>
                </article>
              ))}
              <Link
                to='/produits'
                className='inline-flex pt-3 text-sm font-bold text-sky-600 hover:text-sky-800'
              >
                {t.continueShopping}
              </Link>
            </section>

            <aside className='h-fit rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-7'>
              <h2 className='text-xl font-bold text-gray-900'>{t.checkout}</h2>
              <div className='mt-6 space-y-3 border-b border-gray-100 pb-5 text-sm'>
                <div className='flex justify-between text-gray-500'>
                  <span>{t.subtotal}</span>
                  <span>{formatPrixFcfa(total)}</span>
                </div>
                <div className='flex justify-between text-gray-500'>
                  <span>{t.shipping}</span>
                  <span className='font-semibold text-emerald-600'>
                    {t.toConfirm}
                  </span>
                </div>
                <div className='flex justify-between pt-2 text-lg font-bold text-gray-900'>
                  <span>{t.total}</span>
                  <span className='text-sky-600'>{formatPrixFcfa(total)}</span>
                </div>
              </div>

              <div className='mt-6 rounded-xl border border-sky-100 bg-sky-50 p-4'>
                <p className='text-sm font-bold text-slate-800'>{t.paymentMethod}</p>
                <p className='mt-1 text-sm leading-6 text-slate-600'>
                  {t.paymentProviderNotice}
                </p>
              </div>

              {changements.length > 0 && (
                <div className='mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800'>
                  <p className='font-semibold'>{t.cartUpdated}</p>
                  <ul className='mt-1 list-disc pl-5'>
                    {changements.map((c, i) => (
                      <li key={i}>
                        {(c.type === 'indisponible'
                          ? t.cartItemUnavailable
                          : c.type === 'prix'
                          ? t.cartPriceChanged
                          : t.cartQuantityReduced
                        )
                          .replace('{nom}', c.nom)
                          .replace('{n}', c.quantite)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {erreur && <p className='mt-4 text-sm text-red-500'>{erreur}</p>}

              <button
                type='button'
                onClick={confirmerCommande}
                disabled={confirmation || cart.some(item => item.available === false)}
                className='mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50'
              >
                <Check size={18} />
                {confirmation ? '...' : t.confirmOrder}
              </button>
              {cart.some(item => item.available === false) && (
                <p className='mt-3 text-sm text-red-600'>{t.cartUnavailableDescription}</p>
              )}
              <div className='mt-5 flex gap-2 text-xs leading-5 text-gray-500'>
                <ShieldCheck className='shrink-0 text-emerald-500' size={17} />{' '}
                {t.securePayment}
              </div>
            </aside>
          </div>
        )}
      </div>
    </motion.main>
  )
}

function EmptyCart () {
  const { t } = useLanguage()
  return (
    <section className='rounded-2xl border border-dashed border-sky-200 bg-white px-6 py-20 text-center'>
      <ShoppingCartIcon />
      <h2 className='mt-5 text-2xl font-bold text-gray-900'>{t.emptyCart}</h2>
      <p className='mt-2 text-gray-500'>{t.emptyCartDescription}</p>
      <Link
        to='/produits'
        className='mt-6 inline-flex rounded-xl bg-sky-500 px-5 py-3 font-semibold text-white'
      >
        {t.discoverProducts}
      </Link>
    </section>
  )
}

function ShoppingCartIcon () {
  return (
    <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-600'>
      <ShoppingCartIconGlyph />
    </div>
  )
}

function ShoppingCartIconGlyph () {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      className='h-7 w-7'
    >
      <path d='M3 3h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 7H6' />
      <circle cx='10' cy='20' r='1' />
      <circle cx='18' cy='20' r='1' />
    </svg>
  )
}

