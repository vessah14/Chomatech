import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import googleIcon from '../assets/google.png'
import facebookIcon from '../assets/facebook.png'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { prechargerGoogle, prechargerFacebook, obtenirJetonGoogle, obtenirJetonFacebook } from '../api/socialAuth'
import logo from '../assets/chomatech-logo.png'
import Loading from '../Components/common/Loading'
import { motion } from 'framer-motion'

export default function AuthForm () {
  const [activeTab, setActiveTab] = useState('connexion')
  const { t } = useLanguage()

  return (
    <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }} 
          className='auth-page min-h-screen flex flex-col items-center justify-center px-4 py-10'>
      <div className='flex items-center gap-3 mb-6'>
        <img
          src={logo}
          alt='CHOMA TECH'
          className='mb-6 h-30 w-30 object-contain'
        />
      </div>
      <div className='auth-panel w-full max-w-[480px] rounded-3xl p-8 shadow-xl backdrop-blur-md'>
        <div className='flex rounded-xl bg-sky-100/60 p-1 mb-6'>
          <button
            type='button'
            onClick={() => setActiveTab('connexion')}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
              activeTab === 'connexion'
                ? 'bg-white text-sky-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.login}
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('inscription')}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
              activeTab === 'inscription'
                ? 'bg-white text-sky-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.signUp}
          </button>
        </div>
        {activeTab === 'connexion' ? <LoginForm /> : <SignupForm />}
      </div>
    </motion.div>
  )
}

function LoginForm () {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginSocial } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const redirectTo = location.state?.from || '/admin'

  // Charge les SDK dès l'affichage : la fenêtre Google/Facebook doit s'ouvrir directement dans
  // le clic, sinon le navigateur la bloque comme popup non sollicitée.
  useEffect(() => {
    prechargerGoogle().catch(() => {})
    prechargerFacebook().catch(() => {})
  }, [])

  async function connexionSociale (provider, obtenirJeton) {
    setError('')
    let accessToken
    try {
      // Pas d'écran de chargement ici : il démonterait le formulaire pendant que la fenêtre
      // du fournisseur est ouverte.
      accessToken = await obtenirJeton()
    } catch (err) {
      setError(err.message)
      return
    }

    setIsLoading(true)
    try {
      await loginSocial(provider, accessToken, rememberMe)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setIsLoading(false)
      setError(err.message)
    }
  }

  function handleChange (event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setError('')
  }

  async function handleSubmit (event) {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(form.email, form.password, rememberMe)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setIsLoading(false)
      setError(err.message || t.invalidEmail)
    }
  }

  if (isLoading) return <Loading fullScreen message={t.loginLoading} />

  return (
    <>
      <h2 className='text-center text-2xl font-extrabold text-gray-900'>
        {t.welcomeBack}
      </h2>
      <p className='text-center text-sm text-gray-500 mt-1 mb-6'>
        {t.connectSpace}
      </p>
      <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
        <label className='block text-xs font-semibold tracking-wide text-gray-500'>
          {t.email}
          <input
            type='email'
            name='email'
            value={form.email}
            onChange={handleChange}
            required
            placeholder='your@email.com'
            className='mt-2 w-full rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm'
          />
        </label>
        <label className='block text-xs font-semibold tracking-wide text-gray-500'>
          {t.password}
          <div className='relative mt-2'>
            <input
              type={showPassword ? 'text' : 'password'}
              name='password'
              value={form.password}
              onChange={handleChange}
              required
              placeholder='••••••••'
              className='w-full rounded-xl border border-sky-200 bg-white px-4 py-2.5 pr-10 text-sm'
            />
            <button
              type='button'
              aria-label={showPassword ? t.hidePassword : t.showPassword}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 hover:bg-slate-100 hover:text-gray-800'
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        <div className='flex items-center justify-between gap-2'>
          <label className='flex items-center gap-2 text-sm text-gray-600'>
            <input
              type='checkbox'
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
            />
            {t.remember}
          </label>
          <Link to='/mot-de-passe-oublie' className='text-sm font-medium text-sky-600 hover:text-sky-700'>
            {t.forgotPasswordLink}
          </Link>
        </div>
        {error && <p role='alert' className='rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700'>{error}</p>}
        <button
          type='submit'
          disabled={isLoading}
          className='min-h-12 rounded-xl bg-gradient-to-r from-sky-500 to-sky-700 py-3 font-semibold text-white transition hover:from-sky-600 hover:to-sky-800 disabled:cursor-wait disabled:opacity-70'
        >
          {t.signIn}
        </button>
      </form>
      <div className='flex items-center gap-3 my-6'>
        <div className='h-px flex-1 bg-gray-200' />
        <span className='text-xs text-gray-400'>{t.continueWith}</span>
        <div className='h-px flex-1 bg-gray-200' />
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <button
          type='button'
          onClick={() => connexionSociale('google', obtenirJetonGoogle)}
          className='flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm cursor-pointer transition hover:bg-gray-50'
        >
          <img
            src={googleIcon}
            alt='Google'
            className='h-5 w-5 object-contain'
          />
          Google
        </button>
        <button
          type='button'
          onClick={() => connexionSociale('facebook', obtenirJetonFacebook)}
          className='flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm cursor-pointer transition hover:bg-gray-50'
        >
          <img
            src={facebookIcon}
            alt='Facebook'
            className='h-5 w-5 object-contain'
          />
          Facebook
        </button>
      </div>
    </>
  )
}

function SignupForm () {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const { signup } = useAuth()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  function handleChange (event) {
    const { name, value, type, checked } = event.target
    setForm(current => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }))
    setErrors(current => ({ ...current, [name]: '' }))
    setServerError('')
    setSuccess(false)
  }
  async function validateForm (event) {
    event.preventDefault()
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phonePattern = /^\+?[0-9\s()-]{8,}$/
    if (!form.firstName.trim()) nextErrors.firstName = t.required
    if (!form.lastName.trim()) nextErrors.lastName = t.required
    if (!emailPattern.test(form.email)) nextErrors.email = t.invalidEmail
    // Facultatif : le backend ne stocke pas le téléphone, on ne le valide que s'il est saisi.
    if (form.phone.trim() && !phonePattern.test(form.phone)) nextErrors.phone = t.invalidPhone
    if (form.password.length < 8) nextErrors.password = t.shortPassword
    if (form.confirmPassword !== form.password)
      nextErrors.confirmPassword = t.passwordMismatch
    if (!form.acceptedTerms) nextErrors.acceptedTerms = t.acceptTerms
    setErrors(nextErrors)
    const isValid = Object.keys(nextErrors).length === 0
    if (!isValid) {
      setSuccess(false)
      return
    }

    setIsLoading(true)
    setServerError('')
    try {
      // Le téléphone n'est pas collecté par le backend (aucune colonne dédiée sur Client) :
      // on le laisse volontairement de côté plutôt que de l'envoyer pour rien.
      await signup({
        nom: form.lastName,
        prenom: form.firstName,
        email: form.email,
        password: form.password
      })
      setSuccess(true)
      // Même logique que le login : revenir là d'où l'on venait (ex. le panier).
        navigate(location.state?.from || '/admin', { replace: true })
    } catch (err) {
      setServerError(err.message || t.required)
    } finally {
      setIsLoading(false)
    }
  }
  function fieldClass (name) {
    return `w-full rounded-xl border ${
      errors[name] ? 'border-red-400' : 'border-sky-200'
    } bg-white px-4 py-2.5 text-sm`
  }
  const error = name =>
    errors[name] && <p className='mt-1 text-xs text-red-500'>{errors[name]}</p>

  if (isLoading) return <Loading fullScreen message={t.signupLoading} />

  return (
    <>
      <h2 className='text-center text-2xl font-extrabold text-gray-900'>
        {t.createAccount}
      </h2>
      <p className='text-center text-sm text-gray-500 mt-1 mb-6'>
        {t.joinToday}
      </p>
      <form className='flex flex-col gap-4' noValidate onSubmit={validateForm}>
        <div className='grid grid-cols-2 gap-4'>
          <label className='block text-xs font-semibold text-gray-500'>
            {t.firstName}
            <input
              name='firstName'
              value={form.firstName}
              onChange={handleChange}
              placeholder='Jean'
              className={`mt-2 ${fieldClass('firstName')}`}
            />
            {error('firstName')}
          </label>
          <label className='block text-xs font-semibold text-gray-500'>
            {t.lastName}
            <input
              name='lastName'
              value={form.lastName}
              onChange={handleChange}
              placeholder='Dupont'
              className={`mt-2 ${fieldClass('lastName')}`}
            />
            {error('lastName')}
          </label>
        </div>
        <label className='block text-xs font-semibold text-gray-500'>
          {t.email}
          <input
            name='email'
            value={form.email}
            onChange={handleChange}
            type='email'
            placeholder='your@email.com'
            className={`mt-2 ${fieldClass('email')}`}
          />
          {error('email')}
        </label>
        <label className='block text-xs font-semibold text-gray-500'>
          {t.phone}
          <input
            name='phone'
            value={form.phone}
            onChange={handleChange}
            type='tel'
            placeholder='+237 6XX XXX XXX'
            className={`mt-2 ${fieldClass('phone')}`}
          />
          {error('phone')}
        </label>
        <label className='block text-xs font-semibold text-gray-500'>
          {t.password}
          <div className='relative mt-2'>
            <input
              name='password'
              value={form.password}
              onChange={handleChange}
              type={showPassword ? 'text' : 'password'}
              placeholder={t.minimumPassword}
              className={`${fieldClass('password')} pr-10`}
            />
            <button
              type='button'
              aria-label={showPassword ? t.hidePassword : t.showPassword}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 hover:bg-slate-100 hover:text-gray-800'
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error('password')}
        </label>
        <label className='block text-xs font-semibold text-gray-500'>
          {t.confirmPassword}
          <div className='relative mt-2'>
            <input
              name='confirmPassword'
              value={form.confirmPassword}
              onChange={handleChange}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder={t.confirmPasswordPlaceholder}
              className={`${fieldClass('confirmPassword')} pr-10`}
            />
            <button
              type='button'
              aria-label={showConfirmPassword ? t.hidePassword : t.showPassword}
              aria-pressed={showConfirmPassword}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className='absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 hover:bg-slate-100 hover:text-gray-800'
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error('confirmPassword')}
        </label>
        <label className='flex items-start gap-2 text-sm text-gray-600'>
          <input
            name='acceptedTerms'
            checked={form.acceptedTerms}
            onChange={handleChange}
            type='checkbox'
          />
          {t.accept}
          <span>
            {/* Pas de liens tant que les pages CGU / confidentialité n'existent pas (ils menaient à "#"). */}
            <span className='text-sky-500'>{t.terms}</span>{' '}
            {t.and}{' '}
            <span className='text-sky-500'>{t.privacy}</span>
          </span>
        </label>
        {error('acceptedTerms')}{' '}
        {serverError && <p className='text-sm text-red-500'>{serverError}</p>}
        {success && (
          <p className='text-sm text-emerald-600'>{t.signupSuccess}</p>
        )}
        <button
          type='submit'
          disabled={isLoading}
          className='min-h-12 rounded-xl bg-gradient-to-r from-sky-500 to-sky-700 py-3 font-semibold text-white transition hover:from-sky-600 hover:to-sky-800 disabled:cursor-wait disabled:opacity-70'
        >
          {t.createMyAccount}
        </button>
      </form>
    </>
  )
}
