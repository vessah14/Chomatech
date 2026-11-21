import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { demanderReinitialisation } from '../api/auth'
import AuthCard from '../Components/common/AuthCard'
import { champClasse, boutonClasse } from '../Components/common/authStyles'

export default function MotDePasseOublie () {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState('')

  const soumettre = async event => {
    event.preventDefault()
    setEnvoi(true)
    setErreur('')
    try {
      await demanderReinitialisation(email.trim())
      // Même message que l'email existe ou non (le backend ne le révèle pas non plus).
      setEnvoye(true)
    } catch (err) {
      setErreur(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <AuthCard titre={t.forgotTitle} description={envoye ? '' : t.forgotDescription}>
      {envoye ? (
        <div className='flex flex-col items-center gap-4 text-center'>
          <MailCheck className='h-12 w-12 text-sky-500' />
          <p className='text-sm text-gray-600'>{t.forgotSent}</p>
        </div>
      ) : (
        <form onSubmit={soumettre} className='flex flex-col gap-4'>
          <label className='block text-xs font-semibold tracking-wide text-gray-500'>
            {t.email}
            <input
              type='email'
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='your@email.com'
              className={champClasse}
            />
          </label>
          {erreur && <p className='text-sm text-red-500'>{erreur}</p>}
          <button type='submit' disabled={envoi} className={boutonClasse}>
            {envoi ? t.sending : t.forgotSubmit}
          </button>
        </form>
      )}

      <Link to='/authentification' className='mt-6 block text-center text-sm font-medium text-sky-600 hover:text-sky-700'>
        {t.backToLogin}
      </Link>
    </AuthCard>
  )
}
