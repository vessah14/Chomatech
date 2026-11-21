import { Search, Filter, Pencil, Trash2, X, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getUsers, updateUser, updateUserRole, deleteUser } from '../api/users'

const roles = ['Tous', 'Client', 'Admin']

const roleStyle = {
  Admin: 'text-amber-700 bg-amber-100',
  Client: 'text-sky-700 bg-blue-100'
}

function formatDate (iso) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return '—'
  }
}

export default function Clients () {
  const [clients, setClients] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtreRole, setFiltreRole] = useState('Tous')
  const [showFiltre, setShowFiltre] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [clientAModifier, setClientAModifier] = useState(null)
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', role: 'Client' })
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreurModal, setErreurModal] = useState('')

  useEffect(() => {
    let annule = false
    getUsers()
      .then(data => {
        if (!annule) setClients(data)
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

  const ouvrirModification = client => {
    setClientAModifier(client)
    setFormData({
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      role: client.role
    })
    setErreurModal('')
    setShowModal(true)
  }

  const sauvegarder = async () => {
    if (!formData.nom || !formData.prenom || !formData.email) return

    setEnregistrement(true)
    setErreurModal('')
    try {
      const remplacer = misAJour =>
        setClients(current => current.map(c => (c.id === clientAModifier.id ? misAJour : c)))

      // Deux appels distincts : on reflète chacun dès qu'il réussit, pour que la liste ne reste
      // pas périmée si le second (rôle) est refusé, ex. retrait du dernier administrateur.
      remplacer(await updateUser(clientAModifier.id, {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email
      }))

      if (formData.role !== clientAModifier.role) {
        remplacer(await updateUserRole(clientAModifier.id, formData.role))
      }

      setShowModal(false)
    } catch (err) {
      setErreurModal(err.message)
    } finally {
      setEnregistrement(false)
    }
  }

  const supprimer = async client => {
    if (!window.confirm(`Voulez-vous vraiment supprimer ${client.prenom} ${client.nom} ?`)) return

    try {
      await deleteUser(client.id)
      setClients(current => current.filter(c => c.id !== client.id))
    } catch (err) {
      window.alert(err.message)
    }
  }

  const clientsFiltres = clients.filter(c => {
    const matchRecherche =
      `${c.prenom} ${c.nom}`.toLowerCase().includes(recherche.toLowerCase()) ||
      c.email.toLowerCase().includes(recherche.toLowerCase())
    const matchRole = filtreRole === 'Tous' || c.role === filtreRole
    return matchRecherche && matchRole
  })

  return (
    <section className='max-w-full'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200'>
        <div>
          <h1 className='text-lg md:text-3xl font-bold text-slate-800'>
            Gestion des clients
          </h1>
          <span className='text-sm text-slate-500'>
            {clientsFiltres.length} client{clientsFiltres.length > 1 && 's'}
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
            <input
              type='text'
              onChange={e => setRecherche(e.target.value)}
              placeholder='Rechercher un client...'
              value={recherche}
              className='pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <button
            onClick={() => setShowFiltre(!showFiltre)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filtreRole !== 'Tous'
                ? 'bg-blue-50 border-blue-300 text-sky-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className='w-4 h-4' />
            Filtrer
          </button>
        </div>
      </div>

      {showFiltre && (
        <div className='flex items-center gap-2 mt-4 flex-wrap'>
          {roles.map(role => (
            <button
              key={role}
              onClick={() => setFiltreRole(role)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                filtreRole === role
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      )}

      {erreurChargement && (
        <p className='mt-4 text-sm text-red-500'>{erreurChargement}</p>
      )}

      {/* Tableau */}
      <div className='mt-6 bg-white rounded-2xl border border-slate-200 overflow-hidden'>
        <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='bg-slate-50 text-left text-sm text-slate-500'>
              <th className='px-6 py-3 font-medium'>Client</th>
              <th className='px-6 py-3 font-medium'>Email</th>
              <th className='px-6 py-3 font-medium'>Rôle</th>
              <th className='px-6 py-3 font-medium'>Membre depuis</th>
              <th className='px-6 py-3 font-medium'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {chargement ? (
              <tr>
                <td colSpan='5' className='px-6 py-12 text-center text-slate-400'>
                  Chargement...
                </td>
              </tr>
            ) : clientsFiltres.length > 0 ? (
              clientsFiltres.map(client => (
                <tr key={client.id} className='hover:bg-slate-50 transition-colors'>
                  <td className='px-6 py-4 text-sm font-medium text-slate-800'>
                    {client.prenom} {client.nom}
                  </td>
                  <td className='px-6 py-4 text-sm text-slate-500'>
                    {client.email}
                  </td>
                  <td className='px-6 py-4'>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${roleStyle[client.role]}`}
                    >
                      {client.role}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-sm text-slate-500'>
                    {formatDate(client.createdAt)}
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-2'>
                      <a
                        href={`mailto:${client.email}`}
                        className='p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors'
                        title='Envoyer un email'
                      >
                        <Mail className='w-4 h-4' />
                      </a>
                      <button
                        onClick={() => ouvrirModification(client)}
                        className='p-2 text-slate-400 hover:text-sky-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer'
                        title='Modifier'
                      >
                        <Pencil className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => supprimer(client)}
                        className='p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer'
                        title='Supprimer'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan='5' className='px-6 py-12 text-center text-slate-400'>
                  Aucun client trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-2xl p-6 w-full max-w-md shadow-xl'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-bold text-slate-800'>Modifier le client</h2>
              <button
                onClick={() => setShowModal(false)}
                className='p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>
                    Prénom
                  </label>
                  <input
                    type='text'
                    value={formData.prenom}
                    onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                    className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>
                    Nom
                  </label>
                  <input
                    type='text'
                    value={formData.nom}
                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                    className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Email
                </label>
                <input
                  type='email'
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>
                  Rôle
                </label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className='w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='Client'>Client</option>
                  <option value='Admin'>Admin</option>
                </select>
              </div>
            </div>

            {erreurModal && (
              <p className='mt-4 text-sm text-red-500'>{erreurModal}</p>
            )}

            <div className='flex gap-3 mt-6'>
              <button
                onClick={() => setShowModal(false)}
                disabled={enregistrement}
                className='flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Annuler
              </button>
              <button
                onClick={sauvegarder}
                disabled={enregistrement}
                className='flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
