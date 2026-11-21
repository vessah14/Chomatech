// src/router.jsx
import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import Portfolio from './pages/Portfolio'
import App from './App'
import FaqContainer from './pages/Faq'
import Produits from './pages/Produits'
import Contact from './pages/Contact'
import About from './pages/About'
import AuthForm from './pages/Atthentification'
import MotDePasseOublie from './pages/MotDePasseOublie'
import ReinitialiserMotDePasse from './pages/ReinitialiserMotDePasse'
import ProduitDetail from './pages/ProduitDetail'
import Navbarre from './Components/layout/Navbarre'
import ProtectedRoute from './Components/ProtectedRoute'
import ErreurPage from './pages/ErreurPage'
import PanierPage from './pages/PanierPage'
import RetourPaiementPage from './pages/RetourPaiementPage'
import Annonces from './pages/Annonces'
import AdminLayout from './pages/Admin/AdminLayout'
import Dashboard from './pages/Admin/Dashboard'
import MesCommandes from './pages/Admin/MesCommandes'
import MesServices from './pages/Admin/Mes_Services'
import Messagerie from './pages/Admin/Chat'
import Notifications from './pages/Admin/Notification'
import MonProfil from './pages/Admin/Profile'
import Parametres from './pages/Admin/parametre'
import MesAvis from './pages/Admin/Avis'

const router = createBrowserRouter([
  {
    path: '/authentification',
    errorElement: <ErreurPage />,
    element: (
      <>
        <Navbarre />
        <AuthForm />
      </>
    )
  },
  {
    path: '/mot-de-passe-oublie',
    errorElement: <ErreurPage />,
    element: (
      <>
        <Navbarre />
        <MotDePasseOublie />
      </>
    )
  },
  {
    // Lien envoyé par email (voir backend AuthService.DemanderResetPasswordAsync).
    path: '/reinitialiser-mot-de-passe',
    errorElement: <ErreurPage />,
    element: (
      <>
        <Navbarre />
        <ReinitialiserMotDePasse />
      </>
    )
  },
  {
    path: '/',
    errorElement: <ErreurPage />,
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'Services', element: <Services /> },
      { path: 'Services/:id', element: <ServiceDetail /> },
      { path: 'Portfolio', element: <Portfolio /> },
      { path: 'Annonces', element: <Annonces /> },
      { path: 'FaqContainer', element: <FaqContainer /> },
      { path: 'Produits', element: <Produits /> },
      { path: 'produits/:id', element: <ProduitDetail /> },
      { path: 'panier', element: <PanierPage /> },
      {
        path: 'compte/commandes',
        element: (
          <ProtectedRoute>
            <MesCommandes />
          </ProtectedRoute>
        )
      },
      { path: 'paiement/retour', element: <RetourPaiementPage /> },
      { path: 'about', element: <About /> },
      { path: 'Contact', element: <Contact /> }
    ]
  },
  {
    path: '/admin',
    errorElement: <ErreurPage />,
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        label: 'Tableau de bord',
        element: <Dashboard />
      },
      {
        path: 'commandes',
        label: 'Mes commandes',
        element: <MesCommandes />
      },
      {
        path: 'panier',
        label: 'Mon panier',
        element: <PanierPage />
      },
      {
        path: 'services',
        label: 'Mes services',
        element: <MesServices />
      },
      {
        path: 'messages',
        label: 'Messages',
        element: <Messagerie />
      },
      {
        path: 'notification',
        label: 'Notification',
        element: <Notifications />
      },
      {
        path: 'avis',
        label: 'Mon avis',
        element: <MesAvis />
      },
      {
        path: 'profil',
        label: 'Mon profil',
        element: <MonProfil />
      },
      {
        path: 'settings',
        label: 'Paramètres',
        element: <Parametres />
      }
    ]
  },
  {
    // Adresse inconnue : vraie page 404 au lieu de l'écran d'erreur technique.
    path: '*',
    element: (
      <>
        <Navbarre />
        <ErreurPage notFound />
      </>
    )
  }
])

export default router
