import { apiFetch } from './client'

export function getMesConversations (clientId) {
  return apiFetch(`/api/conversations?clientId=${clientId}`)
}

export function creerConversation (clientId) {
  return apiFetch('/api/conversations', {
    method: 'POST',
    body: JSON.stringify({ clientId })
  })
}
