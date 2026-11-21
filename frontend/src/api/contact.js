import { apiFetch } from './client'

export function envoyerMessageContact (data) {
  return apiFetch('/api/messages-contact', { method: 'POST', body: JSON.stringify(data) })
}
