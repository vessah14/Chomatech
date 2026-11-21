import { apiFetch } from './client'

export function getDemandesProduits () {
  return apiFetch('/api/demandes-produits')
}

export function updateDemandeProduitStatut (id, statut) {
  return apiFetch(`/api/demandes-produits/${id}/statut`, {
    method: 'PATCH',
    body: JSON.stringify({ statut })
  })
}

export function updateDemandeProduitPaiement (id, estPaye) {
  return apiFetch(`/api/demandes-produits/${id}/paiement`, {
    method: 'PATCH',
    body: JSON.stringify({ estPaye })
  })
}

export function deleteDemandeProduit (id) {
  return apiFetch(`/api/demandes-produits/${id}`, { method: 'DELETE' })
}
