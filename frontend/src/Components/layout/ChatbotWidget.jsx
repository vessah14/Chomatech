import { useEffect, useRef, useState } from 'react'
import { Bot, MessageCircle, Send, X } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { repondreChatbot } from '../../api/chatbot'

export default function ChatbotWidget () {
  const { language } = useLanguage()
  const en = language === 'en'
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState(() => [{
    from: 'bot',
    text: en
      ? 'Hi! I am the CHOMA TECH assistant. Ask me about our products, services, or practical information.'
      : 'Bonjour ! Je suis l’assistant CHOMA TECH. Posez-moi vos questions sur nos produits, services ou informations pratiques.'
  }])
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sending, open])

  async function envoyer (event) {
    event?.preventDefault()
    const question = draft.trim()
    if (!question || sending) return

    setDraft('')
    setMessages(current => [...current, { from: 'user', text: question }])
    setSending(true)
    try {
      const result = await repondreChatbot(question)
      setMessages(current => [...current, {
        from: 'bot',
        text: result.reply,
        source: result.sourceTitle
      }])
    } catch {
      setMessages(current => [...current, {
        from: 'bot',
        text: en
          ? 'I cannot reach the assistant right now. Please try again later or contact our team.'
          : 'Je ne peux pas joindre l’assistant pour le moment. Réessayez plus tard ou contactez notre équipe.'
      }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className='fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6'>
      {open && (
        <section role='dialog' aria-label={en ? 'CHOMA TECH assistant' : 'Assistant CHOMA TECH'} className='flex h-[min(34rem,calc(100dvh-7rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20'>
          <header className='flex items-center gap-3 bg-gradient-to-r from-sky-700 to-sky-500 px-4 py-3 text-white'>
            <span className='flex h-10 w-10 items-center justify-center rounded-full bg-white/15'><Bot size={22} /></span>
            <span className='min-w-0 flex-1'>
              <span className='block font-bold'>CHOMA TECH</span>
              <span className='block text-xs text-sky-50'>{en ? 'Automatic assistant' : 'Assistant automatique'}</span>
            </span>
            <button type='button' onClick={() => setOpen(false)} aria-label={en ? 'Close chat' : 'Fermer le chat'} className='rounded-lg p-2 transition hover:bg-white/15'><X size={18} /></button>
          </header>

          <div className='flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4' aria-live='polite'>
            {messages.map((message, index) => (
              <div key={`${index}-${message.from}`} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${message.from === 'user' ? 'rounded-br-md bg-sky-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm'}`}>
                  {message.text}
                  {message.source && <span className='mt-1 block text-[11px] opacity-65'>{en ? 'Source' : 'Source'} : {message.source}</span>}
                </div>
              </div>
            ))}
            {sending && <p className='text-xs text-slate-400'>{en ? 'Searching for an answer…' : 'Recherche d’une réponse…'}</p>}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={envoyer} className='flex items-end gap-2 border-t border-slate-100 bg-white p-3'>
            <label className='sr-only' htmlFor='chatbot-message'>{en ? 'Your question' : 'Votre question'}</label>
            <textarea id='chatbot-message' value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) envoyer(event) }} rows={1} maxLength={500} placeholder={en ? 'Type your question…' : 'Écrivez votre question…'} disabled={sending} className='max-h-24 min-h-10 flex-1 resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50' />
            <button type='submit' disabled={!draft.trim() || sending} aria-label={en ? 'Send question' : 'Envoyer la question'} className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40'><Send size={17} /></button>
          </form>
        </section>
      )}

      <button type='button' onClick={() => setOpen(current => !current)} aria-expanded={open} aria-label={open ? (en ? 'Close assistant' : 'Fermer l’assistant') : (en ? 'Open assistant' : 'Ouvrir l’assistant')} className='flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-900/25 transition hover:scale-105 hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700'>
        {open ? <X size={23} /> : <MessageCircle size={24} />}
      </button>
    </div>
  )
}
