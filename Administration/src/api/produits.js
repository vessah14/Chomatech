import { apiFetch, apiUpload } from './client'

export function getProduits () {
  return apiFetch('/api/produits')
}

export function createProduit (data) {
  return apiFetch('/api/produits', { method: 'POST', body: JSON.stringify(data) })
}

export function updateProduit (id, data) {
  return apiFetch(`/api/produits/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteProduit (id) {
  return apiFetch(`/api/produits/${id}`, { method: 'DELETE' })
}

export function uploadProduitImage (file) {
  return apiUpload('/api/uploads/produits', file)
}
