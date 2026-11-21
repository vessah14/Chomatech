import { apiFetch } from './client'

export function getAnnonces () {
  return apiFetch('/api/annonces')
}

export function incrementerVuesAnnonce (id) {
  return apiFetch(`/api/annonces/${id}/vues`, { method: 'POST' })
}
