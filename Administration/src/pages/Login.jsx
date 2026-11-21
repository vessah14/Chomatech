import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/chomatech-logo.png'

export default function Login () {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/admin'

  async function handleSubmit (event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Connexion impossible.')
      setLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-slate-50 px-4'>
      <div className='w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm'>
        <div className='mb-6 text-center'>
          <img
            src={logo}
            alt='CHOMA TECH'
            className='mx-auto mb-3 h-24 w-24 object-contain'
          />
          <h1 className='text-xl font-bold text-slate-800'>Administration</h1>
          <p className='text-sm text-slate-500'>Connectez-vous pour continuer</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700'>
              Email
            </label>
            <input
              type='email'
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='admin@chomatech.com'
              className='w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700'>
              Mot de passe
            </label>
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='••••••••'
                className='w-full rounded-lg border border-slate-200 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer'
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className='text-sm text-red-500'>{error}</p>}

          <button
            type='submit'
            disabled={loading}
            className='w-full cursor-pointer rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* La réinitialisation (email Brevo + page "nouveau mot de passe") vit sur le site client
            et vaut pour tous les comptes, admin compris. */}
        <a
          href={`${import.meta.env.VITE_SITE_URL || 'http://localhost:5173'}/mot-de-passe-oublie`}
          className='mt-4 block text-center text-sm font-medium text-sky-600 hover:text-sky-700'
        >
          Mot de passe oublié ?
        </a>
      </div>
    </div>
  )
}
