import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import { getProduit } from '../api/produits'
import { resolveMediaUrl } from '../api/client'
import { formatPrixFcfa } from '../utils/format'

export default function ProduitDetail () {
  const { id } = useParams()
  const { t } = useLanguage()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loadedId, setLoadedId] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const chargement = loadedId !== id

  useEffect(() => {
    let annule = false
    getProduit(id)
      .then(data => {
        if (annule) return
        setProduct(data)
        setLoadedId(id)
      })
      .catch(() => {
        if (annule) return
        setProduct(null)
        setLoadedId(id)
      })
    return () => {
      annule = true
    }
  }, [id])

  if (chargement) {
    return (
      <section className='mx-auto max-w-3xl px-4 py-28 text-center text-gray-400'>
        {t.loading}
      </section>
    )
  }

  if (!product) {
    return (
      <section className='mx-auto max-w-3xl px-4 py-28 text-center'>
        <h1 className='text-3xl font-bold text-gray-900'>
          {t.productNotFound}
        </h1>
        <Link
          to='/produits'
          className='mt-6 inline-flex rounded-full bg-sky-500 px-5 py-3 font-bold text-white'
        >
          {t.backToShop}
        </Link>
      </section>
    )
  }

  const typeKey = {
    Ordinateur: 'computer',
    'Téléphone': 'phone',
    Audio: 'audio',
    Tablette: 'tablet'
  }[product.categorie]

  const enRupture = product.statut !== 'Disponible' || product.stock <= 0

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className='product-detail-page px-4 py-8 sm:py-14'
    >
      <div className='mx-auto max-w-6xl'>
        <Link
          to='/produits'
          className='mb-8 inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-sky-600'
        >
          <ArrowLeft size={17} /> {t.shop}
        </Link>

        <div className='grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[1.05fr_0.95fr]'>
          <div className='product-detail-image relative flex min-h-[360px] items-center justify-center p-6 sm:min-h-[560px] sm:p-12'>
            {enRupture && (
              <div className='absolute left-6 top-6 rounded-full bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white'>
                {product.statut}
              </div>
            )}
            <img
              src={resolveMediaUrl(product.image)}
              alt={product.nomProduit}
              loading='eager'
              className='max-h-[440px] w-full object-contain mix-blend-multiply'
            />
          </div>

          <div className='flex flex-col p-6 sm:p-12'>
            <span className='text-xs font-bold uppercase tracking-[0.2em] text-sky-600'>
              {t[typeKey] || product.categorie}
            </span>
            <h1 className='mt-3 text-3xl font-bold leading-tight text-gray-950 sm:text-4xl'>
              {product.nomProduit}
            </h1>
            {product.description && (
              <p className='mt-6 text-base leading-7 text-gray-600'>
                {product.description}
              </p>
            )}
            <p className='mt-8 text-4xl font-bold tracking-tight text-slate-950'>
              {formatPrixFcfa(product.montant)}
            </p>

            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <div className='flex h-12 items-center justify-between rounded-xl border border-sky-100 bg-sky-50 px-3 sm:w-36'>
                <button
                  type='button'
                  aria-label='Diminuer la quantitÃ©'
                  onClick={() => setQuantity(value => Math.max(1, value - 1))}
                >
                  <Minus size={16} />
                </button>
                <span className='font-bold'>{quantity}</span>
                <button
                  type='button'
                  aria-label='Augmenter la quantitÃ©'
                  onClick={() =>
                    setQuantity(value => Math.max(1, Math.min(product.stock, value + 1)))
                  }
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                type='button'
                disabled={enRupture}
                onClick={() =>
                  addToCart(
                    {
                      id: product.id,
                      tittle: product.nomProduit,
                      price: product.montant,
                      priceLabel: formatPrixFcfa(product.montant),
                      type: product.categorie,
                      image: product.image
                    },
                    quantity
                  )
                }
                className='flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50'
              >
                <ShoppingBag size={18} />{' '}
                {enRupture ? product.statut : t.addToCart}
              </button>
            </div>

            <div className='mt-10 grid gap-4 border-t border-gray-100 pt-6 text-sm text-gray-600 sm:grid-cols-2'>
              <div className='flex gap-3'>
                <Truck className='shrink-0 text-sky-500' size={20} />
                <span>{t.fastDelivery}</span>
              </div>
              <div className='flex gap-3'>
                <ShieldCheck className='shrink-0 text-sky-500' size={20} />
                <span>{t.qualityWarranty}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  )
}

