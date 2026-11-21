import { apiFetch } from './client'

export function getServices () {
  return apiFetch('/api/services')
}

export function getService (id) {
  return apiFetch(`/api/services/${id}`)
}

export function getMesDemandesServices (clientId) {
  return apiFetch(`/api/demandes-services?clientId=${clientId}`)
}

export function createDemandeService (serviceId) {
  return apiFetch('/api/demandes-services', {
    method: 'POST',
    body: JSON.stringify({ serviceId })
  })
}
