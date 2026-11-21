import { apiFetch } from './client'

export function getAllAvis () {
  return apiFetch('/api/avis')
}

export function updateAvisStatut (id, statut) {
  return apiFetch(`/api/avis/${id}/statut`, {
    method: 'PATCH',
    body: JSON.stringify({ statut })
  })
}

export function deleteAvis (id) {
  return apiFetch(`/api/avis/${id}`, { method: 'DELETE' })
}
