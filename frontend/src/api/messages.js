import { apiFetch } from './client'

export function envoyerMessage (conversationId, contenu) {
  return apiFetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ conversationId, contenu })
  })
}

export function marquerMessageLu (id) {
  return apiFetch(`/api/messages/${id}/lu`, { method: 'PATCH' })
}

export function modifierMessage (id, contenu) {
  return apiFetch(`/api/messages/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ contenu })
  })
}

export function supprimerMessage (id) {
  return apiFetch(`/api/messages/${id}`, { method: 'DELETE' })
}
