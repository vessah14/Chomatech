import { apiFetch } from './client'

export function getParametres () {
  return apiFetch('/api/parametres')
}

export function updateParametres (data) {
  return apiFetch('/api/parametres', { method: 'PUT', body: JSON.stringify(data) })
}
