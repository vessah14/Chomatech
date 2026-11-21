import { Search, Filter, Eye, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDemandesProduits } from '../api/demandesProduits'
import { updateDemandeProduitStatut } from '../api/demandesProduits'
import { getDemandesServices } from '../api/services'

const statuts = ['Tous', 'Préparation', 'En cours', 'Validation', 'Livrée', 'Terminé', 'Annulée']

const statutStyle = {
  Livrée: 'text-green-700 bg-green-100',
  Terminé: 'text-green-700 bg-green-100',
  Préparation: 'text-amber-700 bg-amber-100',
  'En cours': 'text-sky-700 bg-blue-100',
  Validation: 'text-sky-700 bg-blue-100',
  Annulée: 'text-red-700 bg-red-100'
}

function formatMontant (n) {
  return n != null ? `${n.toLocaleString('fr-FR')} FCFA` : '—'
}

function formatDate (iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Commandes () {
  const [commandes, setCommandes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('Tous')
  const [showFiltre, setShowFiltre] = useState(false)
  const [commandeAVoir, setCommandeAVoir] = useState(null)
  const [statutEnregistrement, setStatutEnregistrement] = useState(false)
  const [erreurStatut, setErreurStatut] = useState('')

  async function changerStatutProduit (commande, statut) {
    if (!commande || commande.type !== 'Produit') return
    setStatutEnregistrement(true)
    setErreurStatut('')
    try {
      const updated = await updateDemandeProduitStatut(commande.id, statut)
      setCommandes(current => current.map(item =>
        item.type === 'Produit' && item.id === updated.id ? { ...item, statut: updated.statut } : item
      ))
      setCommandeAVoir(current => current?.id === updated.id ? { ...current, statut: updated.statut } : current)
    } catch (error) {
      setErreurStatut(error.message)
    } finally {
      setStatutEnregistrement(false)
    }
  }

  useEffect(() => {
    let annule = false

    Promise.all([getDemandesProduits(), getDemandesServices()])
      .then(([demandesProduits, demandesServices]) => {
        if (annule) return

        const fusion = [
          ...demandesProduits.map(d => ({
            id: d.id,
            type: 'Produit',
            libelle: d.nomProduit,
            client: d.clientNom,
            date: d.createdAt,
            montant: d.montantUnitaire * d.quantite,
            statut: d.statut,
            quantite: d.quantite
          })),
          ...demandesServices.map(d => ({
            id: d.id,
            type: 'Service',
            libelle: d.nomService,
            client: d.clientNom,
            date: d.createdAt,
            montant: d.montantConvenu,
            statut: d.statut,
            quantite: null
          }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date))

        setCommandes(fusion)
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

  const commandesFiltres = commandes.filter(cmd => {
    const matchRecherche =
      cmd.client.toLowerCase().includes(recherche.toLowerCase()) ||
      cmd.libelle.toLowerCase().includes(recherche.toLowerCase())
    const matchStatut = filtreStatut === 'Tous' || cmd.statut === filtreStatut
    return matchRecherche && matchStatut
  })

  return (
    <section className='max-w-full'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200'>
        <div>
          <h1 className='text-lg md:text-3xl font-bold text-slate-800'>
            Commandes
          </h1>
          <span className='text-sm text-slate-500'>
            Vue d&apos;ensemble des commandes produits et demandes de service
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
            <input
              type='text'
              onChange={e => setRecherche(e.target.value)}
              placeholder='Rechercher...'
              value={recherche}
              className='pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <button
            onClick={() => setShowFiltre(!showFiltre)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filtreStatut !== 'Tous'
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
          {statuts.map(statut => (
            <button
              key={statut}
              onClick={() => setFiltreStatut(statut)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                filtreStatut === statut
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {statut}
            </button>
          ))}
          {filtreStatut !== 'Tous' && (
            <button
              onClick={() => setFiltreStatut('Tous')}
              className='flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-full cursor-pointer'
            >
              <X className='w-3 h-3' />
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {erreur && <p className='mt-4 text-sm text-red-500'>{erreur}</p>}
      {erreurStatut && <p role='alert' className='mt-4 text-sm text-red-600'>{erreurStatut}</p>}

      {/* Tableau */}
      <div className='mt-6 bg-white rounded-2xl border border-slate-200 overflow-hidden'>
        <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='bg-slate-50 text-left text-sm text-slate-500'>
              <th className='px-6 py-3 font-medium'>Type</th>
              <th className='px-6 py-3 font-medium'>Client</th>
              <th className='px-6 py-3 font-medium'>Article</th>
              <th className='px-6 py-3 font-medium'>Quantité</th>
              <th className='px-6 py-3 font-medium'>Date</th>
              <th className='px-6 py-3 font-medium'>Montant</th>
              <th className='px-6 py-3 font-medium'>Statut</th>
              <th className='px-6 py-3 font-medium'>Action</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {chargement ? (
              <tr>
                <td colSpan='8' className='px-6 py-12 text-center text-slate-400'>
                  Chargement...
                </td>
              </tr>
            ) : commandesFiltres.length > 0 ? (
              commandesFiltres.map(cmd => (
                <tr key={`${cmd.type}-${cmd.id}`} className='hover:bg-slate-50 transition-colors'>
                  <td className='px-6 py-4 text-sm text-slate-500'>{cmd.type}</td>
                  <td className='px-6 py-4 text-sm text-slate-600'>{cmd.client}</td>
                  <td className='px-6 py-4 text-sm font-medium text-slate-800'>{cmd.libelle}</td>
                  <td className='px-6 py-4 text-sm text-slate-600'>
                    {cmd.quantite != null
                      ? <span className='inline-flex min-w-9 justify-center rounded-full bg-sky-50 px-2.5 py-1 font-semibold text-sky-700'>{cmd.quantite}</span>
                      : <span className='text-slate-400'>—</span>}
                  </td>
                  <td className='px-6 py-4 text-sm text-slate-500'>{formatDate(cmd.date)}</td>
                  <td className='px-6 py-4 text-sm font-medium text-slate-800'>
                    {formatMontant(cmd.montant)}
                  </td>
                  <td className='px-6 py-4'>
                    {cmd.type === 'Produit' ? (
                      <select
                        aria-label={`Modifier le statut de ${cmd.libelle}`}
                        value={cmd.statut}
                        disabled={statutEnregistrement}
                        onChange={event => changerStatutProduit(cmd, event.target.value)}
                        className={`rounded-full border-0 px-3 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60 ${statutStyle[cmd.statut] || 'text-slate-600 bg-slate-100'}`}
                      >
                        {['Préparation', 'En cours', 'Livrée', 'Annulée'].map(statut => <option key={statut} value={statut}>{statut}</option>)}
                      </select>
                    ) : (
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${statutStyle[cmd.statut] || 'text-slate-600 bg-slate-100'}`}>{cmd.statut}</span>
                    )}
                  </td>
                  <td className='px-6 py-4'>
                    <button
                      onClick={() => setCommandeAVoir(cmd)}
                      className='p-2 text-slate-400 hover:text-sky-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer'
                    >
                      <Eye className='w-4 h-4' />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan='8' className='px-6 py-12 text-center text-slate-400'>
                  Aucune commande trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {commandeAVoir && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-2xl p-6 w-full max-w-md shadow-xl'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-bold text-slate-800'>Détail de la commande</h2>
              <button
                onClick={() => setCommandeAVoir(null)}
                className='p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Type</span>
                <span className='font-medium text-slate-800'>{commandeAVoir.type}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Client</span>
                <span className='font-medium text-slate-800'>{commandeAVoir.client}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Article</span>
                <span className='font-medium text-slate-800'>{commandeAVoir.libelle}</span>
              </div>
              {commandeAVoir.quantite != null && (
                <div className='flex justify-between'>
                  <span className='text-slate-500'>Quantité</span>
                  <span className='font-medium text-slate-800'>{commandeAVoir.quantite}</span>
                </div>
              )}
              <div className='flex justify-between'>
                <span className='text-slate-500'>Montant</span>
                <span className='font-medium text-slate-800'>{formatMontant(commandeAVoir.montant)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Date</span>
                <span className='font-medium text-slate-800'>{formatDate(commandeAVoir.date)}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-slate-500'>Statut</span>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${statutStyle[commandeAVoir.statut] || 'text-slate-600 bg-slate-100'}`}>
                  {commandeAVoir.statut}
                </span>
              </div>
            </div>

            {commandeAVoir.type === 'Produit' ? (
              <label className='mt-6 block text-sm font-medium text-slate-700'>
                Modifier le statut de la commande
                <select value={commandeAVoir.statut} disabled={statutEnregistrement} onChange={event => changerStatutProduit(commandeAVoir, event.target.value)} className='mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:opacity-50'>
                  {['Préparation', 'En cours', 'Livrée', 'Annulée'].map(statut => <option key={statut} value={statut}>{statut}</option>)}
                </select>
              </label>
            ) : (
              <p className='mt-6 text-xs text-slate-400'>Pour modifier le statut, rendez-vous dans la page Services.</p>
            )}
            {erreurStatut && <p role='alert' className='mt-3 text-sm text-red-600'>{erreurStatut}</p>}
          </div>
        </div>
      )}
    </section>
  )
}
