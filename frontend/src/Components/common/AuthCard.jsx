import logo from '../../assets/chomatech-logo.png'

// Cadre commun des pages d'authentification secondaires (mot de passe oublié, réinitialisation),
// identique visuellement à la page de connexion.
export default function AuthCard ({ titre, description, children }) {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 to-sky-100 px-4 py-10'>
      <img src={logo} alt='CHOMA TECH' className='mb-6 h-24 w-24 object-contain' />
      <div className='w-full max-w-[480px] rounded-3xl bg-white/70 backdrop-blur-md shadow-xl p-8'>
        <h1 className='text-center text-2xl font-extrabold text-gray-900'>{titre}</h1>
        <p className='text-center text-sm text-gray-500 mt-1 mb-6'>{description}</p>
        {children}
      </div>
    </div>
  )
}

