import { apiFetch } from './client'

export function inscrireNewsletter (email) {
  return apiFetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) })
}
