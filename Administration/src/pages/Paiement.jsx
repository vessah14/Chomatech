import { DollarSign, Hourglass, BarChart3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDemandesProduits, updateDemandeProduitPaiement } from '../api/demandesProduits'
import { getDemandesServices, updateDemandeServicePaiement } from '../api/services'

const filtresStatut = ['Tout', 'Payé', 'Non payé']

function formatMontant (n) {
  return n != null ? `${n.toLocaleString('fr-FR')} FCFA` : '—'
}

function formatDate (iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function GestionPaiements () {
  const [commandes, setCommandes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState('Tout')

  useEffect(() => {
    let annule = false

    Promise.all([getDemandesProduits(), getDemandesServices()])
      .then(([demandesProduits, demandesServices]) => {
        if (annule) return

        const fusion = [
          ...demandesProduits.map(d => ({
            id: d.id,
            type: 'Produit',
            client: d.clientNom,
            article: d.nomProduit,
            montant: d.montantUnitaire * d.quantite,
            date: d.createdAt,
            estPaye: d.estPaye
          })),
          ...demandesServices
            .filter(d => d.montantConvenu != null)
            .map(d => ({
              id: d.id,
              type: 'Service',
              client: d.clientNom,
              article: d.nomService,
              montant: d.montantConvenu,
              date: d.createdAt,
              estPaye: d.estPaye
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

  const basculerPaiement = async cmd => {
    const nouveauStatut = !cmd.estPaye
    try {
      if (cmd.type === 'Produit') {
        await updateDemandeProduitPaiement(cmd.id, nouveauStatut)
      } else {
        await updateDemandeServicePaiement(cmd.id, nouveauStatut)
      }
      setCommandes(current =>
        current.map(c => (c.id === cmd.id && c.type === cmd.type ? { ...c, estPaye: nouveauStatut } : c))
      )
    } catch (err) {
      window.alert(err.message)
    }
  }

  // Stats
  const totalEncaisse = commandes.filter(c => c.estPaye).reduce((s, c) => s + c.montant, 0)
  const totalAttente = commandes.filter(c => !c.estPaye).reduce((s, c) => s + c.montant, 0)
  const nbTransactions = commandes.length

  const commandesFiltres = commandes.filter(c => {
    const matchRecherche =
      c.client.toLowerCase().includes(recherche.toLowerCase()) ||
      c.article.toLowerCase().includes(recherche.toLowerCase())
    const matchFiltre =
      filtre === 'Tout' ||
      (filtre === 'Payé' && c.estPaye) ||
      (filtre === 'Non payé' && !c.estPaye)
    return matchRecherche && matchFiltre
  })

  const stats = [
    {
      label: 'Total encaissé',
      valeur: formatMontant(totalEncaisse),
      icone: <DollarSign className='w-5 h-5' />,
      fond: 'bg-cyan-50 text-cyan-600'
    },
    {
      label: 'En attente',
      valeur: formatMontant(totalAttente),
      icone: <Hourglass className='w-5 h-5' />,
      fond: 'bg-amber-50 text-amber-600'
    },
    {
      label: 'Transactions',
      valeur: nbTransactions,
      icone: <BarChart3 className='w-5 h-5' />,
      fond: 'bg-blue-50 text-sky-600'
    }
  ]

  return (
    <section className='max-w-full'>
      <h1 className='text-2xl md:text-3xl font-bold text-slate-800 mb-1'>
        Suivi des paiements
      </h1>
      <p className='text-sm text-slate-500 mb-6'>
        Suivi manuel : marquez une commande comme réglée une fois le paiement reçu (pas de passerelle de paiement connectée).
      </p>

      {erreur && <p className='mb-4 text-sm text-red-500'>{erreur}</p>}

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        {stats.map(s => (
          <div
            key={s.label}
            className='flex items-start gap-3 bg-white rounded-2xl border border-slate-200 p-5'
          >
            <div className={`${s.fond} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
              {s.icone}
            </div>
            <div>
              <p className='text-lg font-bold text-slate-800'>{s.valeur}</p>
              <p className='text-xs text-slate-500 mt-0.5'>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className='bg-white rounded-2xl border border-slate-200 overflow-hidden'>
        <div className='p-5 space-y-4'>
          <input
            type='text'
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder='Rechercher un client ou un article...'
            className='w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'
          />

          <div className='flex items-center gap-2 flex-wrap'>
            {filtresStatut.map(f => (
              <button
                key={f}
                onClick={() => setFiltre(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  filtre === f
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-t border-slate-100'>
                <th className='px-5 py-3'>Type</th>
                <th className='px-5 py-3'>Client</th>
                <th className='px-5 py-3'>Article</th>
                <th className='px-5 py-3'>Montant</th>
                <th className='px-5 py-3'>Date</th>
                <th className='px-5 py-3'>Statut</th>
                <th className='px-5 py-3'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {chargement ? (
                <tr>
                  <td colSpan='7' className='px-5 py-12 text-center text-slate-400'>
                    Chargement...
                  </td>
                </tr>
              ) : commandesFiltres.length > 0 ? (
                commandesFiltres.map(c => (
                  <tr key={`${c.type}-${c.id}`} className='hover:bg-slate-50/50 transition-colors'>
                    <td className='px-5 py-4 text-sm text-slate-500'>{c.type}</td>
                    <td className='px-5 py-4 text-sm text-slate-600'>{c.client}</td>
                    <td className='px-5 py-4 text-sm text-slate-600'>{c.article}</td>
                    <td className='px-5 py-4 text-sm font-bold text-slate-800'>{formatMontant(c.montant)}</td>
                    <td className='px-5 py-4 text-sm text-slate-500'>{formatDate(c.date)}</td>
                    <td className='px-5 py-4'>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          c.estPaye ? 'text-green-700 bg-green-100' : 'text-amber-700 bg-amber-100'
                        }`}
                      >
                        {c.estPaye ? 'Payé' : 'Non payé'}
                      </span>
                    </td>
                    <td className='px-5 py-4'>
                      <button
                        onClick={() => basculerPaiement(c)}
                        className='text-sm font-medium text-sky-600 hover:text-cyan-800 transition-colors cursor-pointer'
                      >
                        {c.estPaye ? 'Marquer non payé' : 'Marquer payé'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan='7' className='px-5 py-12 text-center text-slate-400'>
                    Aucune commande trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
