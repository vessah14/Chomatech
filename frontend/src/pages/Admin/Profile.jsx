import { useState, useEffect } from 'react'
import {
  Save,
  Mail,
  User,
  Calendar,
  Package,
  Star,
  Pencil,
  X,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { mettreAJourProfil } from '../../api/users'
import { getMesDemandesProduits } from '../../api/demandesProduits'
import { getMesDemandesServices } from '../../api/services'
import { getMesAvis } from '../../api/avis'

function formatDate (iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

/* ───────── SECTION WRAPPER ───────── */
function Section ({ title, icon: Icon, children, action }) {
  return (
    <div className='rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden'>
      <div className='flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-gray-50/50'>
        <div className='flex items-center gap-2'>
          <Icon size={18} className='text-gray-400' />
          <h2 className='text-sm font-bold text-gray-700 uppercase tracking-wide'>
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/* ───────── INPUT FIELD ───────── */
function Field ({ label, icon: Icon, type = 'text', value, onChange, disabled }) {
  return (
    <div>
      <label className='flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5'>
        <Icon size={12} />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm transition ${
          disabled
            ? 'bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed'
            : 'bg-white border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-300'
        }`}
      />
    </div>
  )
}

/* ───────── PAGE PRINCIPALE ───────── */
export default function MonProfil () {
  const { user, updateUser } = useAuth()
  const { t } = useLanguage()

  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState('')

  const [form, setForm] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    email: user?.email || ''
  })

  const [stats, setStats] = useState({ commandes: 0, avis: 0 })

  useEffect(() => {
    if (!user) return
    let annule = false

    Promise.all([
      getMesDemandesProduits(user.id),
      getMesDemandesServices(user.id),
      getMesAvis(user.id)
    ])
      .then(([demandesProduits, demandesServices, avis]) => {
        if (!annule) {
          setStats({
            commandes: demandesProduits.length + demandesServices.length,
            avis: avis.length
          })
        }
      })
      .catch(() => {})

    return () => {
      annule = true
    }
  }, [user])

  const handleChange = field => e =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setEnregistrement(true)
    setErreur('')
    try {
      const misAJour = await mettreAJourProfil(form)
      updateUser(misAJour)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setErreur(err.message)
    } finally {
      setEnregistrement(false)
    }
  }

  const statsAffichees = [
    { label: t.adminStatOrders, value: stats.commandes, icon: Package, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: t.adminReviewsLeft, value: stats.avis, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
    {
      label: t.adminMemberSince,
      value: user ? formatDate(user.createdAt) : '—',
      icon: Calendar,
      color: 'text-sky-600',
      bg: 'bg-sky-50'
    }
  ]

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-extrabold text-gray-900'>{t.adminProfile}</h1>
        <p className='text-gray-500 mt-1'>
          {t.adminManagePersonalInfo}
        </p>
      </div>

      {saved && (
        <div className='flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/50 px-4 py-3 text-sm font-medium text-emerald-700'>
          <CheckCircle size={16} />
          {t.adminProfileUpdated}
        </div>
      )}

      {/* Carte profil principale */}
      <div className='rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden'>
        <div className='h-24 bg-gradient-to-r from-sky-300 via-sky-500 to-sky-700' />

        <div className='px-6 pb-6 -mt-12'>
          <div className='flex flex-col sm:flex-row items-start gap-4'>
            <div className='h-24 w-24 rounded-2xl bg-gradient-to-br from-sky-300 to-sky-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-sky-200 ring-4 ring-white'>
              {form.prenom.charAt(0).toUpperCase()}
            </div>

            <div className='flex-1 min-w-0 mt-2 sm:mt-14'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                <div>
                  <h2 className='text-xl font-bold text-gray-900'>
                    {form.prenom} {form.nom}
                  </h2>
                  <p className='text-sm text-gray-400 mt-0.5'>{form.email}</p>
                </div>

                <button
                  onClick={() => {
                    // Annuler = revenir aux valeurs enregistrées, sinon la saisie abandonnée
                    // restait affichée comme si elle avait été sauvegardée.
                    if (editing) {
                      setForm({ prenom: user?.prenom || '', nom: user?.nom || '', email: user?.email || '' })
                      setErreur('')
                    }
                    setEditing(!editing)
                  }}
                  className={`self-start flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${
                    editing
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gradient-to-r from-sky-400 to-sky-600 text-white shadow-md shadow-sky-200 hover:shadow-lg active:scale-[0.98]'
                  }`}
                >
                  {editing ? (
                    <>
                      <X size={14} />
                      {t.adminCancel}
                    </>
                  ) : (
                    <>
                      <Pencil size={14} />
                      {t.adminEdit}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        {statsAffichees.map(stat => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className='rounded-2xl bg-white border border-gray-100 p-4 flex items-center gap-3'
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                <Icon size={18} className={stat.color} />
              </div>
              <div>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className='text-[11px] text-gray-400 font-medium'>{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Formulaire */}
      <Section
        title={t.adminPersonalInfo}
        icon={User}
        action={
          editing && (
            <button
              onClick={handleSubmit}
              disabled={enregistrement}
              className='flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-400 to-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-sky-200 transition hover:shadow-md active:scale-[0.98] disabled:opacity-50'
            >
              <Save size={12} />
              {enregistrement ? t.adminSaving : t.adminSave}
            </button>
          )
        }
      >
        <form onSubmit={handleSubmit} className='p-6 space-y-5'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <Field label={t.adminFirstNameLabel} icon={User} value={form.prenom} onChange={handleChange('prenom')} disabled={!editing} />
            <Field label={t.adminLastNameLabel} icon={User} value={form.nom} onChange={handleChange('nom')} disabled={!editing} />
          </div>
          <Field label={t.adminEmailLabel} icon={Mail} type='email' value={form.email} onChange={handleChange('email')} disabled={!editing} />

          {erreur && <p className='text-sm text-red-500'>{erreur}</p>}

          {editing && (
            <button
              type='submit'
              disabled={enregistrement}
              className='flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:shadow-lg active:scale-[0.98] disabled:opacity-50'
            >
              <Save size={16} />
              {enregistrement ? t.adminSaving : t.adminSaveChanges}
            </button>
          )}
        </form>
      </Section>
    </div>
  )
}
