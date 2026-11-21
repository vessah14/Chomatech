import { apiFetch } from './client'

export function getMessagesContact () {
  return apiFetch('/api/messages-contact')
}

export function marquerMessageContactLu (id, lu) {
  return apiFetch(`/api/messages-contact/${id}/lu`, {
    method: 'PATCH',
    body: JSON.stringify({ lu })
  })
}

export function deleteMessageContact (id) {
  return apiFetch(`/api/messages-contact/${id}`, { method: 'DELETE' })
}
