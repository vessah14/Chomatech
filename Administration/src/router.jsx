import { createBrowserRouter, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Layout from './pages/Layout'
import Login from './pages/Login'
import ProtectedRoute from './Components/ProtectedRoute'
import ErreurPage from './pages/ErreurPage'
import Commandes from './pages/Commandes'
import Produits from './pages/Produits'
import Clients from './pages/Clients'
import Services from './pages/Services'
import Annonces from './pages/Annonces'
import Messagerie from './pages/Messagerie'
import GestionNotifications from './pages/Notification'
import GestionFAQ from './pages/FAQ'
import ModerationAvis from './pages/Avis_client'
import Parametres from './pages/Parametre'
import GestionPaiements from './pages/Paiement'
import Realisations from './pages/Realisations'
import MessagesContact from './pages/MessagesContact'
import Newsletter from './pages/Newsletter'
import ChatbotKnowledge from './pages/Chatbot'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to='/admin' replace /> // Redirige automatiquement "/" vers "/admin"
  },
  {
    path: '/login',
    errorElement: <ErreurPage />,
    element: <Login />
  },
  {
    path: '/admin',
    errorElement: <ErreurPage />,
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        label: 'Tableau de bord',
        element: <Dashboard />
      },
      {
        path: 'Commandes',
        element: <Commandes />
      },
      {
        path: 'Produits',
        element: <Produits />
      },
      {
        path: 'Clients',
        element: <Clients />
      },    
      {
        path: 'Services',
        element: <Services />
      },
          
      {
        path: 'Annonces',
        element: <Annonces />
      },
      {
        path: 'realisations',
        element: <Realisations />
      },
      {
        path: 'messages-contact',
        element: <MessagesContact />
      },
      {
        path: 'newsletter',
        element: <Newsletter />
      },
      {
        path: 'chatbot',
        element: <ChatbotKnowledge />
      },
      {
        path: 'Messagerie',
        element: <Messagerie />
      },
      {
        path: 'Notification',
        element: <GestionNotifications />
      },
       {
        path: 'FAQ',
        element: <GestionFAQ />
      },
       {
        path: 'Avis',
        element: <ModerationAvis />
      },
      
       {
        path: 'Parametres',
        element: <Parametres />
      },
      {
        path: 'Paiements',
        element: <GestionPaiements />
      }
    ]
  },
  {
    // Adresse inconnue : vraie page 404 au lieu de l'écran d'erreur technique.
    path: '*',
    element: <ErreurPage notFound />
  }
])

export default router
