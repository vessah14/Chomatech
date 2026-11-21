import { Bell, Users, Clock, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getNotifications, createNotification, deleteNotification } from '../api/notifications'
import { getUsers } from '../api/users'

const typesNotif = ['Annonce', 'Commande', 'Promo', 'Statut', 'Autre']

const typeStyle = {
  Commande: 'text-cyan-700 bg-cyan-50 border border-cyan-200',
  Promo: 'text-amber-700 bg-amber-50 border border-amber-200',
  Statut: 'text-sky-700 bg-blue-50 border border-blue-200',
  Annonce: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  Autre: 'text-slate-600 bg-slate-50 border border-slate-200'
}

const luStyle = {
  true: 'text-green-700 bg-green-100',
  false: 'text-slate-600 bg-slate-100'
}

function formatDate (iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function GestionNotifications () {
  const [notifications, setNotifications] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState('')

  const [clients, setClients] = useState([])

  const [form, setForm] = useState({
    titre: '',
    type: 'Annonce',
    cible: 'tous', // 'tous' | 'client'
    clientId: '',
    message: ''
  })
  const [envoi, setEnvoi] = useState(false)
  const [erreurEnvoi, setErreurEnvoi] = useState('')

  useEffect(() => {
    let annule = false
    Promise.all([getNotifications(), getUsers()])
      .then(([notifs, users]) => {
        if (annule) return
        setNotifications(notifs)
        setClients(users.filter(u => u.role === 'Client'))
      })
      .catch(err => {
        if (!annule) setErreurChargement(err.message)
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  const envoyerNotification = async () => {
    if (!form.titre.trim() || !form.message.trim()) return
    if (form.cible === 'client' && !form.clientId) return

    setEnvoi(true)
    setErreurEnvoi('')
    try {
      const nouvelles = await createNotification({
        titre: form.titre,
        type: form.type,
        clientId: form.cible === 'tous' ? null : form.clientId,
        message: form.message
      })
      setNotifications(current => [...nouvelles, ...current])
      setForm({ titre: '', type: 'Annonce', cible: 'tous', clientId: '', message: '' })
    } catch (err) {
      setErreurEnvoi(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  const supprimer = async id => {
    if (!window.confirm('Supprimer cette notification ?')) return

    try {
      await deleteNotification(id)
      setNotifications(current => current.filter(n => n.id !== id))
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <section className='max-w-full'>
      <h1 className='text-2xl md:text-3xl font-bold text-slate-800 mb-6'>
        Gestion des notifications
      </h1>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* --- Formulaire --- */}
        <div className='bg-white rounded-2xl border border-slate-200 p-6'>
          <h2 className='text-lg font-bold text-slate-800 mb-6'>
            Envoyer une notification
          </h2>

          <div className='space-y-5'>
            <div>
              <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
                Titre de la notification
              </label>
              <input
                type='text'
                value={form.titre}
                onChange={e => setForm({ ...form, titre: e.target.value })}
                placeholder='ex: Votre commande est expédiée'
                className='w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
                Type
              </label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className='w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'
              >
                {typesNotif.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
                Destinataires
              </label>
              <div className='flex gap-2 mb-2'>
                <button
                  type='button'
                  onClick={() => setForm({ ...form, cible: 'tous', clientId: '' })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    form.cible === 'tous'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tous les clients
                </button>
                <button
                  type='button'
                  onClick={() => setForm({ ...form, cible: 'client' })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    form.cible === 'client'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Un client précis
                </button>
              </div>
              {form.cible === 'client' && (
                <select
                  value={form.clientId}
                  onChange={e => setForm({ ...form, clientId: e.target.value })}
                  className='w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'
                >
                  <option value=''>Choisir un client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.prenom} {c.nom} — {c.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
                Message
              </label>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder='Contenu de la notification...'
                rows={5}
                maxLength={300}
                className='w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none'
              />
            </div>

            {erreurEnvoi && <p className='text-sm text-red-500'>{erreurEnvoi}</p>}

            <button
              onClick={envoyerNotification}
              disabled={
                envoi ||
                !form.titre.trim() ||
                !form.message.trim() ||
                (form.cible === 'client' && !form.clientId)
              }
              className='w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 transition-colors shadow-md shadow-cyan-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <Bell className='w-4 h-4' />
              {envoi ? 'Envoi...' : 'Envoyer la notification'}
            </button>
          </div>
        </div>

        {/* --- Historique --- */}
        <div className='bg-white rounded-2xl border border-slate-200 p-6'>
          <h2 className='text-lg font-bold text-slate-800 mb-6'>
            Historique des notifications
          </h2>

          {erreurChargement && (
            <p className='text-sm text-red-500 mb-4'>{erreurChargement}</p>
          )}

          <div className='space-y-4 max-h-[520px] overflow-y-auto pr-1'>
            {chargement ? (
              <p className='text-sm text-slate-400 text-center py-12'>Chargement...</p>
            ) : notifications.length > 0 ? (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className='border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors'
                >
                  <div className='flex items-start justify-between gap-3 mb-3'>
                    <h3 className='text-sm font-semibold text-slate-800'>
                      {notif.titre}
                    </h3>
                    <div className='flex items-center gap-2 shrink-0'>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${luStyle[notif.lu]}`}
                      >
                        {notif.lu ? 'Lue' : 'Non lue'}
                      </span>
                      <button
                        onClick={() => supprimer(notif.id)}
                        className='p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer'
                        title='Supprimer'
                      >
                        <Trash2 className='w-3.5 h-3.5' />
                      </button>
                    </div>
                  </div>

                  <div className='flex items-center gap-4 text-xs text-slate-500 mb-3 flex-wrap'>
                    <span className='flex items-center gap-1.5'>
                      <Users className='w-3.5 h-3.5 text-slate-400' />
                      {notif.clientNom}
                    </span>
                    <span className='flex items-center gap-1.5'>
                      <Clock className='w-3.5 h-3.5 text-slate-400' />
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>

                  <span
                    className={`inline-block px-2.5 py-1 text-xs font-medium rounded-md ${
                      typeStyle[notif.type] || typeStyle.Autre
                    }`}
                  >
                    {notif.type}
                  </span>
                </div>
              ))
            ) : (
              <p className='text-sm text-slate-400 text-center py-12'>
                Aucune notification envoyée
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
