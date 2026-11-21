import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe,
  Lock,
  ChevronRight,
  Save,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { changerMotDePasse } from '../../api/users'

/* ───────── SECTION CARD ───────── */
function SettingsSection ({ title, icon: SectionIcon, children }) {
  return (
    <div className='rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden'>
      <div className='flex items-center gap-2 px-6 py-4 border-b border-gray-50 bg-gray-50/50'>
        <SectionIcon size={18} className='text-gray-400' />
        <h2 className='text-sm font-bold text-gray-700 uppercase tracking-wide'>{title}</h2>
      </div>
      <div className='divide-y divide-gray-50'>{children}</div>
    </div>
  )
}

/* ───────── LINK ROW ───────── */
function LinkRow ({ icon: Icon, iconBg, iconColor, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className='group w-full flex items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-gray-50/50'
    >
      <div className='flex items-center gap-4'>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} transition-transform group-hover:scale-105`}>
          <Icon size={18} className={iconColor} />
        </div>
        <div>
          <p className='font-semibold text-gray-800 text-sm'>{title}</p>
          <p className='text-xs text-gray-400 mt-0.5'>{description}</p>
        </div>
      </div>
      <ChevronRight size={16} className='text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500' />
    </button>
  )
}

/* ───────── MOT DE PASSE ───────── */
function PasswordSection ({ t }) {
  const [changing, setChanging] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [motDePasseActuel, setMotDePasseActuel] = useState('')
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)

  const annuler = () => {
    setChanging(false)
    setMotDePasseActuel('')
    setNouveauMotDePasse('')
    setErreur('')
  }

  const soumettre = async () => {
    if (!motDePasseActuel || nouveauMotDePasse.length < 8) return

    setEnregistrement(true)
    setErreur('')
    try {
      await changerMotDePasse(motDePasseActuel, nouveauMotDePasse)
      setSucces(true)
      setTimeout(() => setSucces(false), 3000)
      annuler()
    } catch (err) {
      setErreur(err.message)
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <SettingsSection title={t.adminSecurity} icon={Lock}>
      <div className='px-6 py-4'>
        {succes && (
          <div className='flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/50 px-4 py-3 text-sm font-medium text-emerald-700 mb-4'>
            <CheckCircle size={16} />
            {t.adminPasswordUpdated}
          </div>
        )}

        {!changing ? (
          <button
            onClick={() => setChanging(true)}
            className='flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:border-gray-300'
          >
            <Lock size={14} />
            {t.adminChangePassword}
          </button>
        ) : (
          <div className='space-y-4'>
            <div className='relative'>
              <label className='block text-xs font-semibold text-gray-500 mb-1.5'>{t.adminCurrentPassword}</label>
              <input
                type={showOld ? 'text' : 'password'}
                value={motDePasseActuel}
                onChange={e => setMotDePasseActuel(e.target.value)}
                placeholder='••••••••'
                className='w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm transition focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-300 focus:bg-white'
              />
              <button
                type='button'
                onClick={() => setShowOld(!showOld)}
                className='absolute right-3 top-[calc(50%+8px)] -translate-y-1/2 text-gray-400 hover:text-gray-600'
              >
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className='relative'>
              <label className='block text-xs font-semibold text-gray-500 mb-1.5'>{t.adminNewPasswordMin}</label>
              <input
                type={showNew ? 'text' : 'password'}
                value={nouveauMotDePasse}
                onChange={e => setNouveauMotDePasse(e.target.value)}
                placeholder='••••••••'
                className='w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm transition focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-300 focus:bg-white'
              />
              <button
                type='button'
                onClick={() => setShowNew(!showNew)}
                className='absolute right-3 top-[calc(50%+8px)] -translate-y-1/2 text-gray-400 hover:text-gray-600'
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {erreur && <p className='text-sm text-red-500'>{erreur}</p>}

            <div className='flex items-center gap-2'>
              <button
                onClick={soumettre}
                disabled={enregistrement || !motDePasseActuel || nouveauMotDePasse.length < 8}
                className='flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <Save size={14} />
                {enregistrement ? t.adminUpdating : t.adminUpdate}
              </button>
              <button onClick={annuler} className='rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100'>
                {t.adminCancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </SettingsSection>
  )
}

/* ───────── PAGE PRINCIPALE ───────── */
export default function Parametres () {
  const { logout } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-extrabold text-gray-900'>{t.adminSettings}</h1>
        <p className='text-gray-500 mt-1'>{t.adminAccountPreferences}</p>
      </div>

      <PasswordSection t={t} />

      <SettingsSection title={t.adminPreferences} icon={Globe}>
        <LinkRow
          icon={Globe}
          iconBg='bg-sky-50'
          iconColor='text-sky-500'
          title={t.adminLanguageLabel}
          description={language === 'fr' ? 'Français (FR)' : 'English (EN)'}
          onClick={toggleLanguage}
        />
      </SettingsSection>

      <div className='rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden'>
        <div className='px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
          <div>
            <p className='font-semibold text-gray-800 text-sm'>{t.adminLogoutTitle}</p>
            <p className='text-xs text-gray-400 mt-0.5'>{t.adminLogoutDescription}</p>
          </div>
          <button
            onClick={handleLogout}
            className='flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50'
          >
            <LogOut size={14} />
            {t.adminLogout}
          </button>
        </div>
      </div>
    </div>
  )
}
