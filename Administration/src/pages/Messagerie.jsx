import { Search, ArrowLeft } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { getAllConversations } from '../api/conversations'
import { sendMessage, markMessageAsRead } from '../api/messages'

const palette = [
  'bg-cyan-600',
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-violet-600'
]

// Couleur stable par client (dérivée de son id), pas aléatoire à chaque rendu.
function couleurPour (clientId) {
  let hash = 0
  for (let i = 0; i < clientId.length; i++) hash = (hash + clientId.charCodeAt(i)) % palette.length
  return palette[hash]
}

function tempsRelatif (iso) {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  const heures = Math.floor(diffMs / 3_600_000)
  if (heures < 1) return "À l'instant"
  if (heures < 24) return `Il y a ${heures}h`
  const jours = Math.floor(heures / 24)
  return jours === 1 ? 'Hier' : `Il y a ${jours} j`
}

function formatHeure (iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function Messagerie () {
  const [listeConvs, setListeConvs] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState('')
  const [convActiveId, setConvActiveId] = useState(null)
  const [afficherChatMobile, setAfficherChatMobile] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const messagesRef = useRef(null)

  useEffect(() => {
    let annule = false
    getAllConversations()
      .then(data => {
        if (annule) return
        setListeConvs(data)
        if (data.length > 0) setConvActiveId(data[0].id)
      })
      .catch(err => {
        if (!annule) setErreurChargement(err.message)
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    // Pas de temps réel côté backend : on relit les conversations régulièrement pour voir
    // arriver les nouveaux messages des clients sans recharger la page.
    const intervalle = setInterval(() => {
      getAllConversations()
        .then(data => {
          if (!annule) setListeConvs(data)
        })
        .catch(() => {})
    }, 15000)

    return () => {
      annule = true
      clearInterval(intervalle)
    }
  }, [])

  const convActive = listeConvs.find(c => c.id === convActiveId) || null

  // Marque comme lus les messages client de la conversation affichée — y compris celle ouverte
  // automatiquement au chargement et les nouveaux messages reçus pendant qu'elle est affichée
  // (auparavant, seul un clic explicite dans la liste les marquait).
  const idsNonLus = (convActive?.messages || [])
    .filter(m => m.sender === 'client' && !m.lu)
    .map(m => m.id)
    .join(',')

  useEffect(() => {
    if (!idsNonLus || !convActiveId) return
    const ids = idsNonLus.split(',')
    Promise.all(ids.map(id => markMessageAsRead(id)))
      .then(() => {
        setListeConvs(current =>
          current.map(c =>
            c.id === convActiveId
              ? { ...c, messages: c.messages.map(m => (ids.includes(m.id) ? { ...m, lu: true } : m)) }
              : c
          )
        )
      })
      .catch(() => {
        // Pas bloquant si le marquage "lu" échoue : la conversation reste consultable.
      })
  }, [idsNonLus, convActiveId])

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [convActiveId, convActive?.messages.length])

  const envoyerMessage = async () => {
    if (!message.trim() || !convActive || envoi) return

    setEnvoi(true)
    try {
      const nouveauMsg = await sendMessage(convActive.id, message)
      setListeConvs(current =>
        current.map(c =>
          c.id === convActive.id
            ? { ...c, messages: [...c.messages, nouveauMsg] }
            : c
        )
      )
      setMessage('')
    } catch (err) {
      window.alert(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      envoyerMessage()
    }
  }

  // Le marquage "lu" est fait par l'effet sur la conversation active (voir plus haut).
  const selectionnerConv = conv => {
    setConvActiveId(conv.id)
    setAfficherChatMobile(true)
  }

  const convsFiltrees = listeConvs.filter(c =>
    (c.clientNom?.toLowerCase() || '').includes(recherche.toLowerCase())
  )

  return (
    <section className='max-w-full'>
      <h1 className='text-2xl md:text-3xl font-bold text-slate-800 mb-6'>
        Messagerie clients
      </h1>

      {erreurChargement && (
        <p className='text-sm text-red-500 mb-4'>{erreurChargement}</p>
      )}

      <div className='flex bg-white rounded-2xl border border-slate-200 overflow-hidden h-[calc(100vh-180px)] lg:h-[600px]'>
        {/* --- Sidebar conversations : occupe tout l'écran sur mobile tant qu'aucune conversation
             n'est ouverte, cède la place à la zone de chat une fois une conversation sélectionnée. --- */}
        <div
          className={`w-full lg:w-80 border-r border-slate-200 flex-col shrink-0 lg:flex ${
            afficherChatMobile ? 'hidden' : 'flex'
          }`}
        >
          {/* Recherche */}
          <div className='p-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
              <input
                type='text'
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                placeholder='Rechercher...'
                className='w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50'
              />
            </div>
          </div>

          {/* Liste */}
          <div className='flex-1 overflow-y-auto'>
            {chargement ? (
              <p className='text-sm text-slate-400 text-center py-8'>Chargement...</p>
            ) : (
              <>
                {convsFiltrees.map(conv => {
                  const dernierMsg = conv.messages[conv.messages.length - 1]
                  const nonLus = conv.messages.filter(
                    m => m.sender === 'client' && !m.lu
                  ).length

                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectionnerConv(conv)}
                      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                        convActiveId === conv.id
                          ? 'bg-blue-50 border-l-[3px] border-l-cyan-600'
                          : 'hover:bg-slate-50 border-l-[3px] border-l-transparent'
                      }`}
                    >
                      <div
                        className={`${couleurPour(conv.clientId)} w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0`}
                      >
                        {conv.clientNom?.[0]?.toUpperCase() || '?'}
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='flex justify-between items-center'>
                          <span className='text-sm font-semibold text-slate-800 truncate'>
                            {conv.clientNom}
                          </span>
                          <span className='text-xs text-slate-400 shrink-0 ml-2'>
                            {tempsRelatif(dernierMsg?.createdAt || conv.createdAt)}
                          </span>
                        </div>
                        <p className='text-xs text-slate-500 truncate mt-0.5'>
                          {dernierMsg?.contenu || 'Aucun message'}
                        </p>
                      </div>

                      {nonLus > 0 && (
                        <span className='bg-cyan-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5'>
                          {nonLus}
                        </span>
                      )}
                    </button>
                  )
                })}

                {convsFiltrees.length === 0 && (
                  <p className='text-sm text-slate-400 text-center py-8'>
                    Aucune conversation
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* --- Zone de chat --- */}
        {convActive ? (
          <div className={`flex-1 flex-col min-w-0 lg:flex ${afficherChatMobile ? 'flex' : 'hidden'}`}>
            {/* Header conversation */}
            <div className='flex items-center gap-3 px-4 py-4 sm:px-6 border-b border-slate-200'>
              <button
                onClick={() => setAfficherChatMobile(false)}
                className='rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 lg:hidden cursor-pointer'
              >
                <ArrowLeft className='w-5 h-5' />
              </button>
              <div
                className={`${couleurPour(convActive.clientId)} w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0`}
              >
                {convActive.clientNom?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className='text-base font-semibold text-slate-800'>
                  {convActive.clientNom}
                </h2>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesRef}
              className='flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-4 bg-slate-50/50'
            >
              {convActive.messages.map(msg => (
                <div key={msg.id}>
                  <div
                    className={`flex ${
                      msg.sender === 'admin' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'client' && (
                      <div
                        className={`${couleurPour(convActive.clientId)} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 mr-2 mt-1`}
                      >
                        {convActive.clientNom?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] sm:max-w-sm md:max-w-md px-4 py-3 text-sm leading-relaxed ${
                        msg.sender === 'admin'
                          ? 'bg-sky-600 text-white rounded-2xl rounded-br-md'
                          : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-bl-md'
                      }`}
                    >
                      {msg.contenu}
                    </div>

                    {msg.sender === 'admin' && (
                      <div className='bg-sky-600 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ml-2 mt-1'>
                        A
                      </div>
                    )}
                  </div>

                  <p
                    className={`text-xs text-slate-400 mt-1 ${
                      msg.sender === 'admin' ? 'text-right mr-10' : 'ml-10'
                    }`}
                  >
                    {formatHeure(msg.createdAt)}
                  </p>
                </div>
              ))}

              {convActive.messages.length === 0 && (
                <p className='text-sm text-slate-400 text-center py-8'>
                  Aucun message dans cette conversation
                </p>
              )}
            </div>

            {/* Input */}
            <div className='px-4 py-4 sm:px-6 border-t border-slate-200 bg-white'>
              <div className='flex flex-wrap items-center gap-3'>
                <input
                  type='text'
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='Répondre...'
                  className='flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'
                />
                <button
                  onClick={envoyerMessage}
                  disabled={!message.trim() || envoi}
                  className='px-5 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 transition-colors shadow-md shadow-cyan-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {envoi ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className='hidden lg:flex flex-1 items-center justify-center text-sm text-slate-400'>
            {chargement ? '' : 'Aucune conversation à afficher'}
          </div>
        )}
      </div>
    </section>
  )
}
