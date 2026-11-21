// Connexion Google (Google Identity Services) et Facebook (SDK JavaScript) côté navigateur.
// Ces fonctions ne renvoient qu'un jeton d'accès du fournisseur : c'est le backend qui le
// vérifie et ouvre la session (voir backend/Services/ExternalAuthService.cs).

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID

export const googleConfigure = Boolean(GOOGLE_CLIENT_ID)
export const facebookConfigure = Boolean(FACEBOOK_APP_ID)

const scripts = {}

function chargerScript (src) {
  if (!scripts[src]) {
    scripts[src] = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.defer = true
      script.onload = resolve
      script.onerror = () => {
        delete scripts[src]
        reject(new Error('Impossible de charger le service de connexion. Vérifiez votre connexion internet.'))
      }
      document.head.appendChild(script)
    })
  }
  return scripts[src]
}

/* ───────── Google ───────── */

let googleTokenClient = null
let googleEnAttente = null

// À appeler au montage de la page : la fenêtre Google doit s'ouvrir directement dans le
// clic de l'utilisateur, sinon le navigateur la bloque comme popup non sollicitée.
export async function prechargerGoogle () {
  if (!googleConfigure || googleTokenClient) return
  await chargerScript('https://accounts.google.com/gsi/client')
  googleTokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'openid email profile',
    callback: reponse => {
      if (!googleEnAttente) return
      if (reponse.error || !reponse.access_token) {
        googleEnAttente.reject(new Error('Connexion Google refusée.'))
      } else {
        googleEnAttente.resolve(reponse.access_token)
      }
      googleEnAttente = null
    },
    error_callback: erreur => {
      if (!googleEnAttente) return
      googleEnAttente.reject(new Error(
        erreur?.type === 'popup_closed' ? 'Connexion Google annulée.' : 'Impossible d\'ouvrir la fenêtre Google (popup bloquée ?).'
      ))
      googleEnAttente = null
    }
  })
}

export async function obtenirJetonGoogle () {
  if (!googleConfigure) {
    throw new Error('La connexion Google n\'est pas encore configurée (VITE_GOOGLE_CLIENT_ID manquant).')
  }
  if (!googleTokenClient) await prechargerGoogle()

  return new Promise((resolve, reject) => {
    googleEnAttente = { resolve, reject }
    googleTokenClient.requestAccessToken({ prompt: 'select_account' })
  })
}

/* ───────── Facebook ───────── */

let facebookPret = null

export function prechargerFacebook () {
  if (!facebookConfigure) return Promise.resolve()
  if (!facebookPret) {
    facebookPret = chargerScript('https://connect.facebook.net/fr_FR/sdk.js')
      .then(() => {
        window.FB.init({ appId: FACEBOOK_APP_ID, cookie: false, xfbml: false, version: 'v21.0' })
      })
      .catch(err => {
        facebookPret = null
        throw err
      })
  }
  return facebookPret
}

export async function obtenirJetonFacebook () {
  if (!facebookConfigure) {
    throw new Error('La connexion Facebook n\'est pas encore configurée (VITE_FACEBOOK_APP_ID manquant).')
  }
  if (!window.FB) await prechargerFacebook()

  return new Promise((resolve, reject) => {
    window.FB.login(reponse => {
      if (reponse.authResponse?.accessToken) {
        resolve(reponse.authResponse.accessToken)
      } else {
        reject(new Error('Connexion Facebook annulée.'))
      }
    }, { scope: 'public_profile,email' })
  })
}
