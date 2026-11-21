import { ArrowUpRight, Eye } from 'lucide-react'
import Badge from './Badge'
import { useLanguage } from '../../context/LanguageContext'

export default function CardRealisation ({
  image,
  title,
  stack,
  badge,
  lien,
  onViewDetails
}) {
  const { t } = useLanguage()
  return (
    <article className='overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm transition hover:shadow-lg'>
      {/* Image + badge catégorie */}
      <div className='relative overflow-hidden'>
        <img
          alt={title}
          src={
            image ||
            'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=1160'
          }
          className='h-56 w-full object-cover'
        />

        {badge && (
          <span className='absolute bottom-4 left-4 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-sky-400 shadow-md'>
            {t[badge] || badge}
          </span>
        )}
      </div>

      {/* Contenu texte */}
      <div className='p-4 sm:p-6'>
        <h3 className='text-lg font-bold text-gray-900'>{t[title] || title}</h3>

        <div className='mt-3 flex flex-wrap gap-2'>
          {stack.map(tech => (
            <Badge
              key={tech}
              className='bg-gray-100 text-gray-600 px-3 py-1 text-sm font-medium'
            >
              {tech}
            </Badge>
          ))}
        </div>

        <div className='mt-4 flex flex-wrap items-center gap-x-5 gap-y-2'>
          <button
            type='button'
            onClick={onViewDetails}
            className='flex items-center gap-1 text-sm font-semibold text-sky-500 transition hover:text-sky-700 cursor-pointer'
          >
            <Eye size={15} />
            {t.viewDetails || 'Voir les détails'}
          </button>

          {lien && (
            <a
              href={lien}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-1 text-sm font-semibold text-gray-500 transition hover:text-sky-600'
            >
              {t.visitProject || 'Voir le projet'}
              <ArrowUpRight size={15} />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
