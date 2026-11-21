import { Star } from 'lucide-react'

export default function StarRating ({ value = 0, onChange, readOnly = false, size = 24 }) {
  return (
    <div className='flex gap-1'>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type='button'
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
          className={readOnly ? 'cursor-default' : 'cursor-pointer'}
        >
          <Star
            size={size}
            className={
              n <= value
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-200 text-slate-200'
            }
          />
        </button>
      ))}
    </div>
  )
}
