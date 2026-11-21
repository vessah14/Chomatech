import { Mail, MailOpen, Trash2, X, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getMessagesContact, marquerMessageContactLu, deleteMessageContact } from '../api/messagesContact'

function formatDate (iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function MessagesContact () {
  const [messages, setMessages] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [messageOuvert, setMessageOuvert] = useState(null)

  useEffect(() => {
    let annule = false
    getMessagesContact()
      .then(data => {
        if (!annule) setMessages(data)
      })
      .catch(err => {
        if (!annule) setErreur(err.message)
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  const ouvrir = async message => {
    setMessageOuvert(message)
    if (!message.lu) {
      try {
        const misAJour = await marquerMessageContactLu(message.id, true)
        setMessages(current => current.map(m => (m.id === message.id ? misAJour : m)))
        setMessageOuvert(misAJour)
      } catch {
        // La lecture du message ne doit pas échouer même si le marquage "lu" rate.
      }
    }
  }

  const basculerLu = async message => {
    try {
      const misAJour = await marquerMessageContactLu(message.id, !message.lu)
      setMessages(current => current.map(m => (m.id === message.id ? misAJour : m)))
    } catch (err) {
      window.alert(err.message)
    }
  }

  const supprimer = async id => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce message ?')) return

    try {
      await deleteMessageContact(id)
      setMessages(current => current.filter(m => m.id !== id))
      setMessageOuvert(current => (current?.id === id ? null : current))
    } catch (err) {
      window.alert(err.message)
    }
  }

  const messagesFiltres = messages.filter(m =>
    m.nomComplet.toLowerCase().includes(recherche.toLowerCase()) ||
    m.email.toLowerCase().includes(recherche.toLowerCase()) ||
    m.message.toLowerCase().includes(recherche.toLowerCase())
  )

  const nbNonLus = messages.filter(m => !m.lu).length

  return (
    <section className='max-w-full'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200'>
        <div>
          <h1 className='text-lg md:text-3xl font-bold text-slate-800'>Messages de contact</h1>
          <span className='text-sm text-slate-500'>
            {nbNonLus} message{nbNonLus > 1 ? 's' : ''} non lu{nbNonLus > 1 ? 's' : ''}
          </span>
        </div>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
          <input
            type='text'
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder='Rechercher...'
            className='pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>
      </div>

      {erreur && <p className='mt-4 text-sm text-red-500'>{erreur}</p>}

      <div className='mt-6 space-y-3'>
        {chargement ? (
          <div className='bg-white rounded-2xl border border-slate-200 py-12 text-center text-slate-400'>
            Chargement...
          </div>
        ) : messagesFiltres.length > 0 ? (
          messagesFiltres.map(message => (
            <div
              key={message.id}
              onClick={() => ouvrir(message)}
              className={`bg-white rounded-2xl border p-5 cursor-pointer transition-colors hover:bg-slate-50 ${
                message.lu ? 'border-slate-200' : 'border-blue-300 bg-blue-50/30'
              }`}
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex items-start gap-3 min-w-0'>
                  {message.lu ? (
                    <MailOpen className='w-5 h-5 text-slate-400 shrink-0 mt-0.5' />
                  ) : (
                    <Mail className='w-5 h-5 text-sky-500 shrink-0 mt-0.5' />
                  )}
                  <div className='min-w-0'>
                    <p className={`text-sm ${message.lu ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                      {message.nomComplet}
                      {message.entreprise && <span className='text-slate-400 font-normal'> · {message.entreprise}</span>}
                    </p>
                    <p className='text-xs text-slate-500'>{message.email}</p>
                    <p className='text-sm text-slate-600 mt-2 truncate max-w-xl'>{message.message}</p>
                  </div>
                </div>
                <span className='text-xs text-slate-400 shrink-0'>{formatDate(message.createdAt)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className='bg-white rounded-2xl border border-slate-200 py-12 text-center text-slate-400'>
            Aucun message reçu
          </div>
        )}
      </div>

      {messageOuvert && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-bold text-slate-800'>{messageOuvert.nomComplet}</h2>
              <button
                onClick={() => setMessageOuvert(null)}
                className='p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Email</span>
                <a href={`mailto:${messageOuvert.email}`} className='font-medium text-sky-600'>
                  {messageOuvert.email}
                </a>
              </div>
              {messageOuvert.telephone && (
                <div className='flex justify-between'>
                  <span className='text-slate-500'>Téléphone</span>
                  <span className='font-medium text-slate-800'>{messageOuvert.telephone}</span>
                </div>
              )}
              {messageOuvert.entreprise && (
                <div className='flex justify-between'>
                  <span className='text-slate-500'>Entreprise</span>
                  <span className='font-medium text-slate-800'>{messageOuvert.entreprise}</span>
                </div>
              )}
              {messageOuvert.serviceSouhaite && (
                <div className='flex justify-between'>
                  <span className='text-slate-500'>Service souhaité</span>
                  <span className='font-medium text-slate-800'>{messageOuvert.serviceSouhaite}</span>
                </div>
              )}
              {messageOuvert.budget && (
                <div className='flex justify-between'>
                  <span className='text-slate-500'>Budget</span>
                  <span className='font-medium text-slate-800'>{messageOuvert.budget}</span>
                </div>
              )}
              <div className='flex justify-between'>
                <span className='text-slate-500'>Reçu le</span>
                <span className='font-medium text-slate-800'>{formatDate(messageOuvert.createdAt)}</span>
              </div>

              <div className='pt-2 border-t border-slate-100'>
                <p className='text-slate-500 mb-1'>Message</p>
                <p className='text-slate-800 whitespace-pre-line'>{messageOuvert.message}</p>
              </div>
            </div>

            <div className='flex gap-3 mt-6'>
              <button
                onClick={() => basculerLu(messageOuvert)}
                className='flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer'
              >
                {messageOuvert.lu ? 'Marquer non lu' : 'Marquer lu'}
              </button>
              <button
                onClick={() => supprimer(messageOuvert.id)}
                className='flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer'
              >
                <Trash2 className='w-4 h-4' />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
