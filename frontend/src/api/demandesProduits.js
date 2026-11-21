import { apiFetch } from './client'

export function getMesDemandesProduits (clientId) {
  return apiFetch(`/api/demandes-produits?clientId=${clientId}`)
}

export function createDemandeProduit (produitId, quantite) {
  return apiFetch('/api/demandes-produits', {
    method: 'POST',
    body: JSON.stringify({ produitId, quantite })
  })
}

// Validation du panier en une seule requête transactionnelle (tout ou rien côté backend).
export function commanderPanier (lignes) {
  return apiFetch('/api/demandes-produits/lot', {
    method: 'POST',
    body: JSON.stringify({ lignes })
  })
}

export function modifierQuantiteDemande (id, quantite) {
  return apiFetch(`/api/demandes-produits/${id}/quantite`, {
    method: 'PATCH',
    body: JSON.stringify({ quantite })
  })
}

export function annulerDemandeProduit (id) {
  return apiFetch(`/api/demandes-produits/${id}/annuler`, { method: 'POST' })
}

export function supprimerDemandeProduitClient (id) {
  return apiFetch(`/api/demandes-produits/${id}/client`, { method: 'DELETE' })
}
