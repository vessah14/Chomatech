import { apiFetch } from './client'

export function getAnnonces () {
  return apiFetch('/api/annonces')
}

export function createAnnonce (data) {
  return apiFetch('/api/annonces', { method: 'POST', body: JSON.stringify(data) })
}

export function updateAnnonce (id, data) {
  return apiFetch(`/api/annonces/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteAnnonce (id) {
  return apiFetch(`/api/annonces/${id}`, { method: 'DELETE' })
}
