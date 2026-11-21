export const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5016')

// Identifie ce front auprès de l'API : choisit le cookie de session "admin" (distinct de celui
// du site client), et sert de protection CSRF (le backend refuse toute écriture sans cet en-tête).
const APP = 'admin'
const SESSION_KEY = 'chomatech-admin-session'

// Le jeton de connexion vit dans un cookie HttpOnly posé par l'API : JavaScript ne peut ni le
// lire ni le voler (même en cas de faille XSS). On ne garde ici que des infos d'affichage
// (profil + date d'expiration), sans aucune valeur d'authentification.

// Nettoyage de l'ancienne version qui stockait le jeton lui-même dans le navigateur.
localStorage.removeItem('chomatech-admin-token')
localStorage.removeItem('chomatech-admin-user')

// Les URLs d'images renvoyées par le backend sont relatives (ex. "/uploads/produits/xxx.jpg") :
// il faut préfixer l'origine de l'API pour les afficher, car le front tourne sur un autre port.
export function resolveMediaUrl (path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${API_URL}${path}`
}

// sessionStorage : la session admin (cookie de session, 60 min max côté serveur) ne survit
// jamais à la fermeture du navigateur.
export function getStoredUser () {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY))
    if (!session?.user) return null
    if (!session.expiration || new Date(session.expiration).getTime() <= Date.now()) {
      clearSession()
      return null
    }
    return session.user
  } catch {
    return null
  }
}

export function setSession (user, expiration) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, expiration }))
}

export function clearSession () {
  sessionStorage.removeItem(SESSION_KEY)
}

// Session expirée (60 min) ou révoquée (mot de passe/rôle changé) : retour à la connexion.
function handleUnauthorized () {
  clearSession()
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

async function envoyer (path, options) {
  const avaitSession = getStoredUser() !== null

  // credentials: 'include' : envoie le cookie de session à l'API (autre origine que le front).
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'X-Chomatech-App': APP, ...options.headers },
    credentials: 'include'
  })

  // Uniquement si l'on se croyait connecté : un 401 au login (mauvais mot de passe) doit
  // s'afficher tel quel, pas être pris pour une session expirée.
  if (response.status === 401 && avaitSession) {
    handleUnauthorized()
    throw new Error('Session expirée, veuillez vous reconnecter.')
  }

  if (response.status === 204) return null

  let data
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    // Le middleware backend renvoie toujours { error: "..." } sur les erreurs métier.
    throw new Error(data?.error || `Erreur ${response.status}`)
  }

  return data
}

export function apiFetch (path, options = {}) {
  return envoyer(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  })
}

// Upload de fichier : ne PAS fixer Content-Type ici, le navigateur doit générer lui-même
// le boundary multipart à partir du FormData (sinon la requête est mal formée côté serveur).
export function apiUpload (path, file) {
  const formData = new FormData()
  formData.append('file', file)
  return envoyer(path, { method: 'POST', body: formData })
}
