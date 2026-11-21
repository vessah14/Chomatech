import { ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

export default function Panier () {
  const { itemCount } = useCart()

  return (
    <Link
      to='/admin/panier'
      aria-label={`Voir le panier (${itemCount} produit${
        itemCount > 1 ? 's' : ''
      })`}
      className='relative flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-sky-50'
    >
      <div className='relative flex items-center justify-center'>
        <span className='absolute -right-3 -top-3 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-xs font-bold text-white'>
          {itemCount}
        </span>
        <ShoppingCart className='text-gray-600' />
      </div>
    </Link>
  )
}
