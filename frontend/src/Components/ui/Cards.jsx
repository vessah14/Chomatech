import { useLanguage } from '../../context/LanguageContext'
import { Link } from 'react-router-dom'

export default function Cards ({
  tittle,
  className = '',
  className2 = '',
  className3 = '',
  icon,
  fleche,
  label,
  Description,
  id
}) {
  const { t } = useLanguage()
  const translatedTitle = t[tittle] || tittle
  const translatedDescription = t[Description] || Description
  const translatedLabel = t[label] || label

  return (
    <>
      <article
        className={`rounded-xl border border-gray-100 bg-white space-y-5 p-4   shadow-sm hover:shadow-2xl hover:shadow-sky-200  hover:-translate-y-2 transition-all duration-300 cursor-pointer sm:p-6 w-full ring ring-sky-200 ${className}`}
      >
        <span className={`inline-block rounded-xl p-3 ${className2}`}>
          <span className={` ${className3}`}>{icon}</span>
        </span>

        {/* Titre cliquable seulement pour un vrai service (id) : les cartes "étapes" n'ont
            pas de page dédiée (auparavant lien "#" pour toutes). */}
        {id
          ? (
            <Link to={`/Services/${id}`}>
              <h3 className='mt-0.5 text-2xl font-bold text-gray-900 hover:text-sky-600 transition'>
                {translatedTitle}
              </h3>
            </Link>
            )
          : (
            <h3 className='mt-0.5 text-2xl font-bold text-gray-900'>{translatedTitle}</h3>
            )}

        <p className={`mt-2 line-clamp-3 text-lg/relaxed text-gray-500 `}>
          {translatedDescription}
        </p>

        {id && translatedLabel && (
        <Link
          to={`/Services/${id}`}
          className='group mt-4 text-lg inline-flex items-center gap-1  font-medium text-sky-600'
        >
          {translatedLabel}
          <span
            aria-hidden='true'
            className='block transition-all group-hover:ms-0.5 rtl:rotate-180'
          >
            {fleche}
          </span>
        </Link>
        )}
      </article>
    </>
  )
}
