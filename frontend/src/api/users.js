import { apiFetch } from './client'

export function getMonProfil () {
  return apiFetch('/api/users/me')
}

export function mettreAJourProfil (data) {
  return apiFetch('/api/users/me', { method: 'PUT', body: JSON.stringify(data) })
}

export function changerMotDePasse (motDePasseActuel, nouveauMotDePasse) {
  return apiFetch('/api/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ motDePasseActuel, nouveauMotDePasse })
  })
}
