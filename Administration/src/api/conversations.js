import { apiFetch } from './client'

export function getAllConversations () {
  return apiFetch('/api/conversations')
}

export function getConversationById (id) {
  return apiFetch(`/api/conversations/${id}`)
}
