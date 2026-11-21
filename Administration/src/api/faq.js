import { apiFetch } from './client'

export function getFaqs () {
  return apiFetch('/api/faqs')
}

export function createFaq (data) {
  return apiFetch('/api/faqs', { method: 'POST', body: JSON.stringify(data) })
}

export function updateFaq (id, data) {
  return apiFetch(`/api/faqs/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteFaq (id) {
  return apiFetch(`/api/faqs/${id}`, { method: 'DELETE' })
}
