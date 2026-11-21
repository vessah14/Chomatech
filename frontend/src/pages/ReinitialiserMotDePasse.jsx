import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { reinitialiserMotDePasse } from '../api/auth'
import AuthCard from '../Components/common/AuthCard'
import { champClasse, boutonClasse } from '../Components/common/authStyles'

// Page ouverte depuis le lien reçu par email : /reinitialiser-mot-de-passe?token=...
export default function ReinitialiserMotDePasse () {
  const { t } = useLanguage()
  const [params] = useSearchParams()
  const token = params.get('token')

  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [afficher, setAfficher] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [succes, setSucces] = useState(false)
  const [erreur, setErreur] = useState('')

  const soumettre = async event => {
    event.preventDefault()
    if (motDePasse.length < 8) return setErreur(t.shortPassword)
    if (motDePasse !== confirmation) return setErreur(t.passwordMismatch)

    setEnvoi(true)
    setErreur('')
    try {
      await reinitialiserMotDePasse(token, motDePasse, confirmation)
      setSucces(true)
    } catch (err) {
      // Lien expiré (30 min), déjà utilisé ou falsifié : message du backend.
      setErreur(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  if (!token) {
    return (
      <AuthCard titre={t.resetTitle} description={t.resetMissingToken}>
        <Link to='/mot-de-passe-oublie' className={`${boutonClasse} block text-center`}>
          {t.requestNewLink}
        </Link>
      </AuthCard>
    )
  }

  if (succes) {
    return (
      <AuthCard titre={t.resetTitle} description=''>
        <div className='flex flex-col items-center gap-4 text-center'>
          <CheckCircle className='h-12 w-12 text-emerald-500' />
          <p className='text-sm text-gray-600'>{t.resetSuccess}</p>
          <Link to='/authentification' className={`${boutonClasse} block text-center`}>
            {t.signIn}
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard titre={t.resetTitle} description={t.resetDescription}>
      <form onSubmit={soumettre} className='flex flex-col gap-4'>
        <label className='block text-xs font-semibold tracking-wide text-gray-500'>
          {t.newPasswordLabel}
          <div className='relative'>
            <input
              type={afficher ? 'text' : 'password'}
              required
              value={motDePasse}
              onChange={e => setMotDePasse(e.target.value)}
              placeholder='••••••••'
              autoComplete='new-password'
              className={`${champClasse} pr-10`}
            />
            <button
              type='button'
              onClick={() => setAfficher(!afficher)}
              className='absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer'
              tabIndex={-1}
            >
              {afficher ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        <label className='block text-xs font-semibold tracking-wide text-gray-500'>
          {t.confirmPassword}
          <input
            type={afficher ? 'text' : 'password'}
            required
            value={confirmation}
            onChange={e => setConfirmation(e.target.value)}
            placeholder='••••••••'
            autoComplete='new-password'
            className={champClasse}
          />
        </label>
        <p className='text-xs text-gray-400'>{t.minimumPassword}</p>
        {erreur && (
          <p className='text-sm text-red-500'>
            {erreur}{' '}
            <Link to='/mot-de-passe-oublie' className='font-medium underline'>{t.requestNewLink}</Link>
          </p>
        )}
        <button type='submit' disabled={envoi} className={boutonClasse}>
          {envoi ? t.sending : t.resetSubmit}
        </button>
      </form>

      <Link to='/authentification' className='mt-6 block text-center text-sm font-medium text-sky-600 hover:text-sky-700'>
        {t.backToLogin}
      </Link>
    </AuthCard>
  )
}
