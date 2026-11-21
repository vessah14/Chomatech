import { apiFetch } from './client'

export function getRealisations () {
  return apiFetch('/api/realisations')
}
