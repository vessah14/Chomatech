import { apiFetch } from './client'

export function sendMessage (conversationId, contenu) {
  return apiFetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ conversationId, contenu })
  })
}

export function markMessageAsRead (id) {
  return apiFetch(`/api/messages/${id}/lu`, { method: 'PATCH' })
}
