import { Bot, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  createKnowledgebaseEntry,
  deleteKnowledgebaseEntry,
  getKnowledgebase,
  updateKnowledgebaseEntry
} from '../api/knowledgebase'

const formInitial = { titre: '', contenu: '' }

export default function ChatbotKnowledge () {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(formInitial)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    getKnowledgebase()
      .then(data => { if (!cancelled) setEntries(data) })
      .catch(error => { if (!cancelled) setLoadError(error.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filteredEntries = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return entries
    return entries.filter(entry =>
      `${entry.titre} ${entry.contenu}`.toLocaleLowerCase().includes(needle)
    )
  }, [entries, query])

  function openCreate () {
    setEditing(null)
    setShowForm(true)
    setForm(formInitial)
    setFormError('')
  }

  function openEdit (entry) {
    setEditing(entry)
    setShowForm(true)
    setForm({ titre: entry.titre, contenu: entry.contenu })
    setFormError('')
  }

  function closeForm () {
    setEditing(null)
    setShowForm(false)
    setForm(formInitial)
    setFormError('')
  }

  async function saveEntry (event) {
    event.preventDefault()
    const data = { titre: form.titre.trim(), contenu: form.contenu.trim() }
    if (data.titre.length < 2 || !data.contenu) {
      setFormError('Saisis un titre et une réponse complète.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        const updated = await updateKnowledgebaseEntry(editing.id, data)
        setEntries(current => current.map(entry => entry.id === updated.id ? updated : entry))
        setNotice('Information mise à jour.')
      } else {
        const created = await createKnowledgebaseEntry(data)
        setEntries(current => [created, ...current])
        setNotice('Information ajoutée.')
      }
      closeForm()
      window.setTimeout(() => setNotice(''), 3500)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeEntry (entry) {
    if (!window.confirm(`Supprimer « ${entry.titre} » de la base du chatbot ?`)) return
    try {
      await deleteKnowledgebaseEntry(entry.id)
      setEntries(current => current.filter(item => item.id !== entry.id))
      setNotice('Information supprimée.')
      window.setTimeout(() => setNotice(''), 3500)
    } catch (error) {
      setLoadError(error.message)
    }
  }

  return (
    <section className='mx-auto max-w-6xl space-y-6'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <div className='mb-2 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800'>
            <Bot size={15} /> Assistant CHOMA TECH
          </div>
          <h1 className='text-2xl font-bold text-slate-900 sm:text-3xl'>Base de connaissances</h1>
          <p className='mt-1 max-w-2xl text-sm leading-6 text-slate-500'>Ajoute des réponses de référence sur les services, les produits, les paiements, les délais ou les contacts.</p>
        </div>
        <button type='button' onClick={openCreate} className='inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700'>
          <Plus size={17} /> Ajouter une information
        </button>
      </header>

      <div className='rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900'>
        Rédige des réponses simples et précises. Ces informations sont enregistrées dans la base réservée à l’administration.
      </div>

      {notice && <p role='status' className='rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'>{notice}</p>}
      {loadError && <p role='alert' className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>{loadError}</p>}

      <label className='relative block max-w-md'>
        <Search size={17} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
        <span className='sr-only'>Rechercher une information</span>
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder='Rechercher dans la base...' className='w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100' />
      </label>

      {showForm ? (
        <form onSubmit={saveEntry} className='space-y-4 rounded-2xl border border-sky-200 bg-white p-5 shadow-sm sm:p-6'>
          <div className='flex items-center justify-between gap-4'>
            <h2 className='font-semibold text-slate-900'>{editing ? 'Modifier une information' : 'Nouvelle information'}</h2>
            <button type='button' onClick={closeForm} aria-label='Fermer le formulaire' className='rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700'><X size={18} /></button>
          </div>
          <label className='block space-y-1.5 text-sm font-medium text-slate-700'>
            Titre / question
            <input autoFocus maxLength={270} required value={form.titre} onChange={event => setForm(current => ({ ...current, titre: event.target.value }))} placeholder='Ex. Quels sont les moyens de paiement ?' className='w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100' />
          </label>
          <label className='block space-y-1.5 text-sm font-medium text-slate-700'>
            Réponse
            <textarea required rows={5} value={form.contenu} onChange={event => setForm(current => ({ ...current, contenu: event.target.value }))} placeholder='Saisis ici les informations utiles que l’assistant devra connaître…' className='w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 font-normal leading-6 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100' />
          </label>
          {formError && <p role='alert' className='text-sm text-red-600'>{formError}</p>}
          <div className='flex flex-wrap gap-2'>
            <button type='submit' disabled={saving} className='rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50'>{saving ? 'Enregistrement…' : editing ? 'Enregistrer les changements' : 'Ajouter à la base'}</button>
            <button type='button' onClick={closeForm} className='rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50'>Annuler</button>
          </div>
        </form>
      ) : null}

      <div className='grid gap-4 md:grid-cols-2'>
        {loading ? (
          <p className='py-10 text-center text-sm text-slate-400 md:col-span-2'>Chargement des informations…</p>
        ) : filteredEntries.length ? filteredEntries.map(entry => (
          <article key={entry.id} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <div className='flex items-start justify-between gap-4'>
              <div className='min-w-0'>
                <h2 className='font-semibold leading-6 text-slate-900'>{entry.titre}</h2>
                <p className='mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600'>{entry.contenu}</p>
              </div>
              <div className='flex shrink-0 gap-1'>
                <button type='button' onClick={() => openEdit(entry)} aria-label={`Modifier ${entry.titre}`} className='rounded-lg p-2 text-sky-700 hover:bg-sky-50'><Pencil size={17} /></button>
                <button type='button' onClick={() => removeEntry(entry)} aria-label={`Supprimer ${entry.titre}`} className='rounded-lg p-2 text-red-600 hover:bg-red-50'><Trash2 size={17} /></button>
              </div>
            </div>
          </article>
        )) : (
          <div className='rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center md:col-span-2'>
            <Bot size={28} className='mx-auto text-slate-300' />
            <p className='mt-3 font-medium text-slate-700'>{query ? 'Aucun résultat pour cette recherche.' : 'La base de connaissances est vide.'}</p>
            <p className='mt-1 text-sm text-slate-500'>{query ? 'Essaie avec un autre mot.' : 'Ajoute des réponses pour préparer les informations de l’assistant.'}</p>
          </div>
        )}
      </div>
    </section>
  )
}
