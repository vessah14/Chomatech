import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../Components/ui/StatCard'
import { getUsers } from '../api/users'
import { getDemandesProduits } from '../api/demandesProduits'
import { getDemandesServices } from '../api/services'
import { getAllAvis } from '../api/avis'
import { getProduits } from '../api/produits'
import { getAnnonces } from '../api/annonces'
import { getFaqs } from '../api/faq'
import { getMessagesContact } from '../api/messagesContact'

function formatMontant (n) {
  return n.toLocaleString('fr-FR')
}

// Vocabulaire de statut partagé entre commandes produits, demandes de service, avis, annonces :
// on mappe par famille de sens plutôt que par valeur exacte pour couvrir les deux vocabulaires.
const styleParFamille = {
  positif: 'bg-green-100 text-green-600 font-semibold',
  enCours: 'bg-blue-100 text-sky-600 font-semibold',
  attente: 'bg-amber-100 text-amber-600 font-semibold',
  negatif: 'bg-red-100 text-red-600 font-semibold'
}

function styleStatut (statut) {
  if (['Livrée', 'Terminé', 'Publiée'].includes(statut)) return styleParFamille.positif
  if (['En cours', 'Validation'].includes(statut)) return styleParFamille.enCours
  if (['Annulée'].includes(statut)) return styleParFamille.negatif
  return styleParFamille.attente
}

function formatDateCourte (iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Dashboard () {
  const [donnees, setDonnees] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false

    Promise.all([
      getUsers(),
      getDemandesProduits(),
      getDemandesServices(),
      getAllAvis(),
      getProduits(),
      getAnnonces(),
      getFaqs(),
      getMessagesContact()
    ])
      .then(([clients, demandesProduits, demandesServices, avis, produits, annonces, faqs, messagesContact]) => {
        if (!annule) {
          setDonnees({ clients, demandesProduits, demandesServices, avis, produits, annonces, faqs, messagesContact })
        }
      })
      .catch(err => {
        if (!annule) setErreur(err.message)
      })

    return () => {
      annule = true
    }
  }, [])

  if (erreur) {
    return <p role='alert' className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700'>{erreur}</p>
  }

  if (!donnees) {
    return <div role='status' className='flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-500'><span className='mr-3 size-5 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600' />Chargement du tableau de bord...</div>
  }

  const { clients, demandesProduits, demandesServices, avis, produits, annonces, faqs, messagesContact } = donnees

  const caProduits = demandesProduits
    .filter(d => d.statut !== 'Annulée')
    .reduce((s, d) => s + d.montantUnitaire * d.quantite, 0)
  const caServices = demandesServices
    .filter(d => d.statut !== 'Annulée' && d.montantConvenu)
    .reduce((s, d) => s + d.montantConvenu, 0)
  const caTotal = caProduits + caServices

  const nbClients = clients.filter(c => c.role === 'Client').length
  const nbCommandes = demandesProduits.length + demandesServices.length
  const avisEnAttente = avis.filter(a => a.statut === 'En attente').length
  const messagesNonLus = messagesContact.filter(m => !m.lu).length

  const cards = [
    {
      Icone: '💰',
      Montant: formatMontant(caTotal),
      devise: 'FCFA',
      Raison: 'Chiffre d\'affaires',
      className1: 'bg-gradient-to-r from-sky-500 via-sky-500 to-sky-600 rounded-2xl p-6 text-white'
    },
    {
      Icone: '📦',
      Montant: nbCommandes,
      devise: 'commandes',
      Raison: 'Total commandes',
      className1: 'bg-gradient-to-r from-purple-500 via-purple-500 to-purple-600 rounded-2xl p-6 text-white'
    },
    {
      Icone: '👥',
      Montant: nbClients,
      devise: 'clients',
      Raison: 'Clients enregistrés',
      className1: 'bg-gradient-to-r from-green-500 via-green-500 to-green-600 rounded-2xl p-6 text-white'
    },
    {
      Icone: '⭐',
      Montant: avisEnAttente,
      devise: 'avis',
      Raison: 'Avis en attente',
      className1: 'bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 rounded-2xl p-6 text-white'
    },
    {
      Icone: '📨',
      Montant: messagesNonLus,
      devise: 'messages',
      Raison: 'Messages non lus',
      className1: 'bg-gradient-to-r from-rose-500 via-rose-500 to-rose-600 rounded-2xl p-6 text-white'
    }
  ]

  const produitsActifs = produits.filter(p => p.statut === 'Disponible').length
  const commandesLivrees = demandesProduits.filter(d => d.statut === 'Livrée').length
  const noteMoyenne = avis.length > 0 ? avis.reduce((s, a) => s + a.note, 0) / avis.length : 0

  const stats = [
    {
      label: 'Produits actifs',
      value: `${produitsActifs} / ${produits.length}`,
      progress: produits.length > 0 ? (produitsActifs / produits.length) * 100 : 0
    },
    {
      label: 'Commandes livrées',
      value: `${commandesLivrees} / ${demandesProduits.length}`,
      progress: demandesProduits.length > 0 ? (commandesLivrees / demandesProduits.length) * 100 : 0
    },
    {
      label: 'Note moyenne des avis',
      value: avis.length > 0 ? `${noteMoyenne.toFixed(1)} / 5` : '—',
      progress: (noteMoyenne / 5) * 100
    },
    {
      label: 'FAQ',
      value: `${faqs.length} question${faqs.length > 1 ? 's' : ''}`,
      progress: 0
    }
  ]

  const commandesRecentes = [
    ...demandesProduits.map(d => ({
      nom: d.clientNom,
      badge: d.statut,
      code: `#${d.id.slice(0, 8)}`,
      date: d.createdAt
    })),
    ...demandesServices.map(d => ({
      nom: d.clientNom,
      badge: d.statut,
      code: `#${d.id.slice(0, 8)}`,
      date: d.createdAt
    }))
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  const annoncesRecentes = [...annonces]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3)

  const messagesRecents = [...messagesContact]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3)

  return (
    <>
      <section className='max-w-full'>
        <div className='text-sm flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200'>
          <div>
            <h1 className='text-lg md:text-2xl font-bold text-slate-800'>
              Tableau de bord
            </h1>
            <span className='text-sm text-slate-500'>Vue d&apos;ensemble</span>
          </div>
          <div className='flex flex-wrap items-center gap-3'>
            <Link
              to='/admin/Produits'
              className='px-4 py-2 bg-sky-600 text-white rounded-lg text-base md:text-lg font-medium hover:bg-sky-700 transition-colors shadow-md shadow-blue-600/20 cursor-pointer'
            >
              Nouveau produit
            </Link>
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mt-10'>
          {cards.map((item, index) => (
            <StatCard
              key={index}
              Icone={item.Icone}
              Montant={item.Montant}
              device={item.devise}
              Raison={item.Raison}
              className1={item.className1}
            />
          ))}
        </div>
      </section>

      <section className='mt-5'>
        <StatutGlobal stats={stats} />
      </section>

      <section className='grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5'>
        <CommandesRecentes commandes={commandesRecentes} />
        <AnnoncesRecentes annonces={annoncesRecentes} />
        <MessagesRecents messages={messagesRecents} />
      </section>
    </>
  )
}

function StatutGlobal ({ stats }) {
  return (
    <div className='bg-white rounded-2xl p-6 border border-slate-200'>
      <h2 className='text-lg font-bold text-slate-800 mb-4'>Statut global</h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4'>
        {stats.map((item, index) => (
          <div key={index}>
            <div className='flex justify-between mb-1'>
              <span className='text-sm text-slate-600'>{item.label}</span>
              <span className='text-sm font-semibold text-slate-800'>
                {item.value}
              </span>
            </div>
            <div className='w-full h-2 bg-slate-100 rounded-full'>
              <div
                className='h-2 bg-blue-500 rounded-full'
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CommandesRecentes ({ commandes }) {
  return (
    <div className='bg-white rounded-2xl p-6 border border-slate-200'>
      <div className='flex justify-between'>
        <h1 className='font-bold text-lg'>Commandes récentes</h1>
        <Link to='/admin/Commandes' className='text-sky-500 font-semibold'>Voir tout</Link>
      </div>
      <div className='mt-6 flex flex-col gap-5'>
        {commandes.length > 0 ? (
          commandes.map((item, index) => (
            <div key={index} className='flex justify-between items-center'>
              <span className='flex flex-col'>
                <span className='font-semibold'>{item.nom}</span>
                <span className='text-sm text-gray-600'>{item.code}</span>
              </span>
              <span className={`flex text-sm items-center py-1 px-5 rounded-full ${styleStatut(item.badge)}`}>
                {item.badge}
              </span>
            </div>
          ))
        ) : (
          <p className='text-sm text-slate-400'>Aucune commande pour le moment.</p>
        )}
      </div>
    </div>
  )
}

function MessagesRecents ({ messages }) {
  return (
    <div className='bg-white rounded-2xl p-6 border border-slate-200'>
      <div className='flex justify-between'>
        <h1 className='font-bold text-lg'>Messages de contact récents</h1>
        <Link to='/admin/messages-contact' className='text-sky-500 font-semibold'>Voir tout</Link>
      </div>
      <div className='mt-6 flex flex-col gap-5'>
        {messages.length > 0 ? (
          messages.map((item, index) => (
            <div key={index} className='flex justify-between items-center gap-3'>
              <span className='flex flex-col min-w-0'>
                <span className='font-semibold truncate'>{item.nomComplet}</span>
                <span className='text-sm text-gray-600 truncate max-w-45'>{item.message}</span>
              </span>
              <span
                className={`shrink-0 flex text-sm items-center py-1 px-4 rounded-full ${
                  item.lu ? 'bg-slate-100 text-slate-500 font-semibold' : 'bg-blue-100 text-sky-600 font-semibold'
                }`}
              >
                {item.lu ? 'Lu' : 'Non lu'}
              </span>
            </div>
          ))
        ) : (
          <p className='text-sm text-slate-400'>Aucun message pour le moment.</p>
        )}
      </div>
    </div>
  )
}

function AnnoncesRecentes ({ annonces }) {
  return (
    <div className='bg-white rounded-2xl p-6 border border-slate-200'>
      <div className='flex justify-between'>
        <h1 className='font-bold text-lg'>Annonces récentes</h1>
        <Link to='/admin/Annonces' className='text-sky-500 font-semibold'>Gérer</Link>
      </div>
      <div className='mt-6 flex flex-col gap-5'>
        {annonces.length > 0 ? (
          annonces.map((item, index) => (
            <div key={index} className='flex justify-between items-center'>
              <span className='flex flex-col'>
                <span className='font-semibold'>{item.titre}</span>
                <span className='text-sm text-gray-600'>
                  {formatDateCourte(item.createdAt)} · {item.vues} vue{item.vues > 1 ? 's' : ''}
                </span>
              </span>
              <span className={`flex text-sm items-center py-1 px-5 rounded-full ${styleStatut(item.statut)}`}>
                {item.statut}
              </span>
            </div>
          ))
        ) : (
          <p className='text-sm text-slate-400'>Aucune annonce pour le moment.</p>
        )}
      </div>
    </div>
  )
}
