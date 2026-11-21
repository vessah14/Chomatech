import { apiFetch, apiUpload } from './client'

export function getRealisations () {
  return apiFetch('/api/realisations')
}

export function createRealisation (data) {
  return apiFetch('/api/realisations', { method: 'POST', body: JSON.stringify(data) })
}

export function updateRealisation (id, data) {
  return apiFetch(`/api/realisations/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteRealisation (id) {
  return apiFetch(`/api/realisations/${id}`, { method: 'DELETE' })
}

export function uploadRealisationImage (file) {
  return apiUpload('/api/uploads/realisations', file)
}
