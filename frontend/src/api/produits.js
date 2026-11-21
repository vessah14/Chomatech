import { apiFetch } from './client'

export function getProduits () {
  return apiFetch('/api/produits')
}

export function getProduit (id) {
  return apiFetch(`/api/produits/${id}`)
}
