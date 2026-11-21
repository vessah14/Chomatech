import { apiFetch } from './client'

export function getFaqs () {
  return apiFetch('/api/faqs')
}
