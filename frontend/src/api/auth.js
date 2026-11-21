import { apiFetch } from './client'

export function login (email, password, rememberMe = false) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, rememberMe })
  })
}

export function logout () {
  return apiFetch('/api/auth/logout', { method: 'POST' })
}

// Réponse toujours identique (compte existant ou non) : rien n'indique si l'email est inscrit.
export function demanderReinitialisation (email) {
  return apiFetch('/api/auth/demander-reset-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  })
}

export function reinitialiserMotDePasse (token, newPassword, confirmPassword) {
  return apiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword, confirmPassword })
  })
}

export function signup (payload) {
  return apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

// provider : 'google' | 'facebook'. Le jeton est re-vérifié côté serveur auprès du fournisseur.
export function loginSocial (provider, accessToken, rememberMe = false) {
  return apiFetch(`/api/auth/${provider}`, {
    method: 'POST',
    body: JSON.stringify({ accessToken, rememberMe })
  })
}
