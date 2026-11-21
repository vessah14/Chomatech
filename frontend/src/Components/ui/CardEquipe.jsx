import { useState } from 'react'

// Carte membre de l'équipe (page À propos). Si la photo manque ou ne se charge pas, on affiche
// les initiales sur un dégradé plutôt qu'un grand cadre vide.
export default function CardEquipe ({ name, role, imageSrc, Poste }) {
  const [imageEnErreur, setImageEnErreur] = useState(false)
  const initiales = name
    .split(' ')
    .map(mot => mot[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <article className='overflow-hidden rounded-lg border-2 border-sky-400 transition hover:shadow-sky-200 hover:-translate-y-2 duration-300 ease-in-out hover:shadow-lg'>
      {imageSrc && !imageEnErreur ? (
        <img
          alt={name}
          src={imageSrc}
          onError={() => setImageEnErreur(true)}
          className='h-56 w-full object-cover'
        />
      ) : (
        <div className='flex h-56 w-full items-center justify-center bg-gradient-to-br from-sky-100 to-sky-300'>
          <span className='text-5xl font-extrabold text-white drop-shadow'>{initiales}</span>
        </div>
      )}

      <div className='bg-white p-4 sm:p-6'>
        <p className='block text-xs text-gray-500'>{Poste}</p>
        <h3 className='mt-0.5 text-lg text-gray-900'>{name}</h3>
        <p className='mt-2 line-clamp-3 text-sm/relaxed text-gray-500'>{role}</p>
      </div>
    </article>
  )
}
