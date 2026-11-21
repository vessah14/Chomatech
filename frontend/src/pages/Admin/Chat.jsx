import { useState, useRef, useEffect } from 'react'
import { Send, Check, CheckCheck, Pencil, Trash2, Check as Save, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { getMesConversations, creerConversation } from '../../api/conversations'
import { envoyerMessage, marquerMessageLu, modifierMessage, supprimerMessage } from '../../api/messages'
import { repondreAuDernierMessage, repondreDansConversation } from '../../api/chatbot'

function formatHeure (iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/* ───────── PAGE PRINCIPALE ───────── */
export default function Messagerie () {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [conversation, setConversation] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [draft, setDraft] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [editionId, setEditionId] = useState(null)
  const [texteEdition, setTexteEdition] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!user) return
    let annule = false

    // Marque "lus" les messages de l'admin affichés (le client les a vus), pour que l'admin
    // voie l'accusé de lecture et que son compteur de non-lus reste juste.
    const marquerAdminLus = conv => {
      conv.messages
        .filter(m => m.sender === 'admin' && !m.lu)
        .forEach(m => marquerMessageLu(m.id).catch(() => {}))
    }

    // creerConversation est idempotent côté backend (renvoie la conversation existante) :
    // pas de doublon même si cet effet tourne deux fois.
    const charger = async () => {
      const data = await getMesConversations(user.id)
      const conv = data.length > 0 ? data[0] : await creerConversation(user.id)
      if (conv.messages.at(-1)?.sender === 'client') {
        try {
          const autoReply = await repondreAuDernierMessage(conv.id)
          if (autoReply) conv.messages = [...conv.messages, autoReply]
        } catch {
          // L'historique reste consultable même si le chatbot ou sa base est indisponible.
        }
      }
      return conv
    }

    charger()
      .then(conv => {
        if (annule) return
        setConversation(conv)
        marquerAdminLus(conv)
      })
      .catch(err => {
        if (!annule) setErreur(err.message)
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })

    // Pas de temps réel côté backend : on relit la conversation régulièrement pour faire
    // apparaître les réponses de l'admin sans recharger la page.
    const intervalle = setInterval(() => {
      getMesConversations(user.id)
        .then(data => {
          if (annule || data.length === 0) return
          setConversation(data[0])
          marquerAdminLus(data[0])
        })
        .catch(() => {})
    }, 15000)

    return () => {
      annule = true
      clearInterval(intervalle)
    }
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages.length])

  const sendMessage = async () => {
    const contenu = draft.trim()
    if (!contenu || !conversation || envoi) return

    setEnvoi(true)
    setErreur('')
    try {
      const nouveauMsg = await envoyerMessage(conversation.id, contenu)
      setDraft('')
      setConversation(current => ({
        ...current,
        messages: [...current.messages.filter(message => message.id !== nouveauMsg.id), nouveauMsg]
      }))

      const reponseAuto = await repondreDansConversation(conversation.id, contenu)
      setConversation(current => ({
        ...current,
        messages: [...current.messages.filter(message => message.id !== reponseAuto.id), reponseAuto]
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      }))
    } catch (err) {
      setErreur(err.message || 'La réponse automatique est indisponible. Votre message a été transmis au support.')
    } finally {
      setEnvoi(false)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const commencerEdition = message => {
    setEditionId(message.id)
    setTexteEdition(message.contenu)
    setErreur('')
  }

  const enregistrerEdition = async id => {
    const contenu = texteEdition.trim()
    if (!contenu) return
    try {
      const modifie = await modifierMessage(id, contenu)
      setConversation(current => ({
        ...current,
        messages: current.messages.map(message => message.id === id ? modifie : message)
      }))
      setEditionId(null)
      setTexteEdition('')
    } catch (err) {
      setErreur(err.message || 'Impossible de modifier ce message.')
    }
  }

  const effacerMessage = async message => {
    if (!window.confirm('Supprimer ce message ?')) return
    try {
      await supprimerMessage(message.id)
      setConversation(current => ({
        ...current,
        messages: current.messages.filter(item => item.id !== message.id)
      }))
    } catch (err) {
      setErreur(err.message || 'Impossible de supprimer ce message.')
    }
  }

  return (
    <div className='max-w-[1200px] mx-auto'>
      <div className='rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden h-[calc(100vh-8rem)] flex flex-col'>
        {/* Header */}
        <div className='flex items-center gap-3 px-4 py-3 sm:px-6 border-b border-gray-100'>
          <div className='h-10 w-10 rounded-full bg-gradient-to-br from-sky-300 to-sky-600 flex items-center justify-center text-white text-sm font-bold shadow-sm'>
            CT
          </div>
          <div>
            <p className='font-semibold text-gray-900 text-sm'>{t.adminSupportName}</p>
            <p className='text-xs text-gray-400'>{t.adminSupportResponseTime}</p>
          </div>
        </div>

        {/* Messages */}
        <div className='flex-1 overflow-y-auto px-4 py-5 sm:px-6 flex flex-col gap-4 bg-gradient-to-b from-gray-50/50 to-white'>
          {erreur && <p className='text-sm text-red-500 text-center'>{erreur}</p>}

          {chargement ? (
            <p className='text-center text-gray-400'>{t.loading}</p>
          ) : conversation?.messages.length > 0 ? (
            conversation.messages.map(m =>
              m.sender === 'admin' || m.sender === 'bot' ? (
                <div key={m.id} className='flex items-end gap-2 max-w-[85%] sm:max-w-[70%]'>
                  <div className='h-7 w-7 rounded-full bg-gradient-to-br from-sky-300 to-sky-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0'>
                    CT
                  </div>
                  <div>
                    <div className='bg-white text-gray-800 text-sm rounded-2xl rounded-bl-md px-4 py-3 break-words shadow-sm border border-gray-100'>
                      {m.contenu}
                    </div>
                    <p className='text-[10px] text-gray-400 mt-1 ml-2'>{formatHeure(m.createdAt)}</p>
                  </div>
                </div>
              ) : (
                <div key={m.id} className='group flex items-end gap-2 max-w-[85%] sm:max-w-[70%] self-end flex-row-reverse'>
                  <div className='h-7 w-7 rounded-full bg-gradient-to-br from-sky-300 to-sky-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0'>
                    {user?.prenom?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className='flex min-w-0 flex-col items-end'>
                    {editionId === m.id ? (
                      <div className='flex max-w-full items-center gap-1 rounded-2xl border border-sky-200 bg-white p-2 shadow-sm'>
                        <input autoFocus value={texteEdition} maxLength={5000} onChange={event => setTexteEdition(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') enregistrerEdition(m.id); if (event.key === 'Escape') setEditionId(null) }} aria-label='Modifier le message' className='min-w-0 flex-1 rounded-lg px-2 py-1 text-sm text-gray-800 outline-none' />
                        <button type='button' onClick={() => enregistrerEdition(m.id)} disabled={!texteEdition.trim()} aria-label='Enregistrer les modifications' title='Enregistrer' className='rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40'><Save size={15} /></button>
                        <button type='button' onClick={() => setEditionId(null)} aria-label='Annuler la modification' title='Annuler' className='rounded-lg p-2 text-gray-500 hover:bg-gray-100'><X size={15} /></button>
                      </div>
                    ) : (
                      <>
                        <div className='bg-gradient-to-br from-sky-400 to-sky-600 text-white text-sm rounded-2xl rounded-br-md px-4 py-3 break-words shadow-md shadow-sky-200/30'>
                          {m.contenu}
                        </div>
                        <div className='mt-1 flex items-center justify-end gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'>
                          <button type='button' onClick={() => commencerEdition(m)} aria-label='Modifier le message' title='Modifier' className='rounded p-1 text-gray-400 hover:bg-sky-50 hover:text-sky-600'><Pencil size={13} /></button>
                          <button type='button' onClick={() => effacerMessage(m)} aria-label='Supprimer le message' title='Supprimer' className='rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600'><Trash2 size={13} /></button>
                        </div>
                      </>
                    )}
                    <p className='text-[10px] text-gray-400 mt-1 mr-2 flex items-center gap-1'>
                      {formatHeure(m.createdAt)}
                      {m.lu ? (
                        <CheckCheck className='w-3.5 h-3.5 text-sky-500' />
                      ) : (
                        <Check className='w-3.5 h-3.5 text-gray-400' />
                      )}
                    </p>
                  </div>
                </div>
              )
            )
          ) : (
            <div className='flex-1 flex flex-col items-center justify-center text-gray-400 text-center'>
              <p className='font-medium'>{t.adminNoMessagesYet}</p>
              <p className='text-sm mt-1'>{t.adminWriteToUs}</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className='border-t border-gray-100 bg-white px-3 py-3 sm:px-6 sm:py-4'>
          <div className='flex items-center gap-2 sm:gap-3'>
            <input
              type='text'
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.adminWriteMessagePlaceholder}
              className='min-w-0 flex-1 rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-300 focus:bg-white'
            />

            <button
              type='button'
              onClick={sendMessage}
              disabled={!draft.trim() || envoi}
              className={`rounded-xl h-10 w-10 flex items-center justify-center shrink-0 transition-all ${
                draft.trim() && !envoi
                  ? 'bg-gradient-to-r from-sky-400 to-sky-600 text-white shadow-md shadow-sky-200 hover:shadow-lg active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send size={16} className={draft.trim() ? '-rotate-12' : ''} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
