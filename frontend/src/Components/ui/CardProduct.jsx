import Badge from './Badge'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useCart } from '../../context/CartContext'
import { resolveMediaUrl } from '../../api/client'
import { formatPrixFcfa } from '../../utils/format'

export default function CardsProduct ({
  type,
  statut,
  className = '',
  tittle,
  price,
  className2 = '',
  image,
  id,
  stock
}) {
  const { t } = useLanguage()
  const { addToCart } = useCart()
  const typeKey = {
    Ordinateur: 'computer',
    Téléphone: 'phone',
    Audio: 'audio',
    Tablette: 'tablet'
  }[type]
  const productPath = id ? `/produits/${id}` : '/produits'
  const priceLabel = formatPrixFcfa(price)
  const enRupture = (statut && statut !== 'Disponible') || (stock !== undefined && Number(stock) <= 0)
  const product = {
    id,
    tittle,
    price: Number(price),
    priceLabel,
    type,
    image,
    stock
  }

  return (
    <>
      <article
        className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-100/70 ${className}`}
      >
        {/* Image + badge superposé */}
        <div className='relative flex flex-col overflow-hidden'>
          {enRupture && (
            <Badge
              className={`absolute top-4 left-4 z-10 py-1 px-2 bg-red-500 text-white ${className2}`}
            >
              <span className='text-sm font-semibold'>{stock !== undefined && Number(stock) <= 0 ? t.outOfStock : statut}</span>
            </Badge>
          )}
          <Link to={productPath} aria-label={`${t.details} : ${tittle}`} className='product-image-stage block bg-slate-50 focus-visible:outline-offset-[-4px]'>
          <img
            alt={tittle}
            src={resolveMediaUrl(image)}
            loading='lazy'
            className='h-48 w-full object-contain p-6 transition-transform duration-500 group-hover:scale-[1.04] sm:h-52'
          />
          </Link>
          {/* Overlay sombre qui apparaît au survol */}
          <div className='product-card__actions flex gap-2 border-t border-slate-100 bg-white p-3'>
            <Link
              to={productPath}
              className='product-card__action product-card__action--details flex min-h-12 flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700'
            >
              {t.details}
            </Link>
            {!enRupture && (
              <button
                type='button'
                onClick={() => addToCart(product)}
                className='product-card__action product-card__action--cart flex min-h-12 flex-1 items-center justify-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700'
              >
                {t.addToCart}
              </button>
            )}
          </div>
        </div>

        {/* Contenu texte */}
        <div className='flex-1 space-y-1 p-4 sm:p-4'>
          <span className='text-xs font-medium uppercase tracking-wide text-sky-600'>
            {t[typeKey] || type}
          </span>
          <h3 className='line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug text-slate-900 sm:text-lg'>{tittle}</h3>
          <p className='pt-1 text-lg font-bold text-slate-900'>{priceLabel}</p>
        </div>
      </article>
    </>
  )
}
