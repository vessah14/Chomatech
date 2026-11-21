import { apiFetch } from './client'

export function repondreChatbot (message) {
  return apiFetch('/api/chatbot/repondre', {
    method: 'POST',
    body: JSON.stringify({ message })
  })
}

export function repondreDansConversation (conversationId, message) {
  return apiFetch(`/api/chatbot/conversations/${conversationId}/repondre`, {
    method: 'POST',
    body: JSON.stringify({ message })
  })
}

export function repondreAuDernierMessage (conversationId) {
  return apiFetch(`/api/chatbot/conversations/${conversationId}/repondre-dernier`, {
    method: 'POST'
  })
}
