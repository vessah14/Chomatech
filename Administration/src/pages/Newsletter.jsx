import { Copy, Download, Trash2, Search, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAbonnesNewsletter, deleteAbonneNewsletter, envoyerNewsletter } from '../api/newsletter'

function formatDate (iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export default function Newsletter () {
  const [abonnes, setAbonnes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [copie, setCopie] = useState(false)
  const [sujet, setSujet] = useState('')
  const [contenu, setContenu] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [resultat, setResultat] = useState('')

  useEffect(() => {
    let annule = false
    getAbonnesNewsletter()
      .then(data => {
        if (!annule) setAbonnes(data)
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

  const supprimer = async id => {
    if (!window.confirm('Voulez-vous vraiment désinscrire cet email ?')) return

    try {
      await deleteAbonneNewsletter(id)
      setAbonnes(current => current.filter(a => a.id !== id))
    } catch (err) {
      window.alert(err.message)
    }
  }

  // Pas d'envoi d'emails côté backend : l'admin copie/exporte la liste vers son outil d'emailing.
  const copierEmails = async () => {
    try {
      await navigator.clipboard.writeText(abonnes.map(a => a.email).join(', '))
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      window.alert('Impossible de copier dans le presse-papiers.')
    }
  }

  const exporterCsv = () => {
    const lignes = ['email,date_inscription', ...abonnes.map(a => `${a.email},${a.createdAt}`)]
    const blob = new Blob([lignes.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const lien = document.createElement('a')
    lien.href = url
    lien.download = 'abonnes-newsletter.csv'
    lien.click()
    URL.revokeObjectURL(url)
  }

  const envoyerCampagne = async event => {
    event.preventDefault()
    if (!window.confirm(`Envoyer cette newsletter à ${abonnes.length} abonné(s) ?`)) return
    setEnvoi(true)
    setResultat('')
    try {
      const reponse = await envoyerNewsletter(sujet, contenu)
      setResultat(`Newsletter envoyée à ${reponse.nombreEnvoye} abonné(s).`)
      setSujet('')
      setContenu('')
    } catch (err) {
      setResultat(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  const abonnesFiltres = abonnes.filter(a =>
    a.email.toLowerCase().includes(recherche.toLowerCase())
  )

  return (
    <section className='max-w-full'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200'>
        <div>
          <h1 className='text-lg md:text-3xl font-bold text-slate-800'>Newsletter</h1>
          <span className='text-sm text-slate-500'>
            {abonnes.length} abonné{abonnes.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
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
          <button
            onClick={copierEmails}
            disabled={abonnes.length === 0}
            className='flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Copy className='w-4 h-4' />
            {copie ? 'Copié !' : 'Copier les emails'}
          </button>
          <button
            onClick={exporterCsv}
            disabled={abonnes.length === 0}
            className='flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Download className='w-4 h-4' />
            Exporter CSV
          </button>
        </div>
      </div>

      {erreur && <p className='mt-4 text-sm text-red-500'>{erreur}</p>}

      <form onSubmit={envoyerCampagne} className='mt-6 bg-white rounded-2xl border border-slate-200 p-5 space-y-3'>
        <div>
          <h2 className='font-semibold text-slate-800'>Envoyer une newsletter</h2>
          <p className='text-sm text-slate-500 mt-1'>Le message sera envoyé aux {abonnes.length} abonné(s) actifs.</p>
        </div>
        <input
          required minLength={3} maxLength={180} value={sujet} onChange={e => setSujet(e.target.value)}
          placeholder='Sujet de l’email' className='w-full px-3 py-2 border border-slate-200 rounded-lg text-sm'
        />
        <textarea
          required minLength={2} maxLength={10000} rows={6} value={contenu} onChange={e => setContenu(e.target.value)}
          placeholder='Contenu de votre newsletter' className='w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-y'
        />
        <div className='flex items-center justify-between gap-3'>
          <p className='text-sm text-slate-500' role='status'>{resultat}</p>
          <button disabled={envoi || abonnes.length === 0} className='inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-50'>
            <Send className='w-4 h-4' />{envoi ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </form>

      <div className='mt-6 bg-white rounded-2xl border border-slate-200 overflow-hidden'>
        {chargement ? (
          <div className='py-12 text-center text-slate-400'>Chargement...</div>
        ) : abonnesFiltres.length > 0 ? (
          <ul className='divide-y divide-slate-100'>
            {abonnesFiltres.map(abonne => (
              <li key={abonne.id} className='flex items-center justify-between gap-4 px-5 py-3'>
                <div className='min-w-0'>
                  <a href={`mailto:${abonne.email}`} className='text-sm font-medium text-slate-800 hover:text-sky-600 truncate block'>
                    {abonne.email}
                  </a>
                  <span className='text-xs text-slate-400'>Inscrit le {formatDate(abonne.createdAt)}</span>
                </div>
                <button
                  onClick={() => supprimer(abonne.id)}
                  title='Désinscrire'
                  className='p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className='py-12 text-center text-slate-400'>Aucun abonné</div>
        )}
      </div>
    </section>
  )
}
