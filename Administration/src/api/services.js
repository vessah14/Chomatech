import { apiFetch } from './client'

export function getServices () {
  return apiFetch('/api/services')
}

export function createService (data) {
  return apiFetch('/api/services', { method: 'POST', body: JSON.stringify(data) })
}

export function updateService (id, data) {
  return apiFetch(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteService (id) {
  return apiFetch(`/api/services/${id}`, { method: 'DELETE' })
}

export function getDemandesServices () {
  return apiFetch('/api/demandes-services')
}

export function updateDemandeServiceStatut (id, statut, montantConvenu) {
  return apiFetch(`/api/demandes-services/${id}/statut`, {
    method: 'PATCH',
    body: JSON.stringify({ statut, montantConvenu })
  })
}

export function updateDemandeServicePaiement (id, estPaye) {
  return apiFetch(`/api/demandes-services/${id}/paiement`, {
    method: 'PATCH',
    body: JSON.stringify({ estPaye })
  })
}

export function deleteDemandeService (id) {
  return apiFetch(`/api/demandes-services/${id}`, { method: 'DELETE' })
}
