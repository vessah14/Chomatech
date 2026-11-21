import { apiFetch } from './client'

export function getAvisPublies () {
  return apiFetch('/api/avis/publies')
}

export function getMesAvis (clientId) {
  return apiFetch(`/api/avis?clientId=${clientId}`)
}

export function createAvis (note, commentaire) {
  return apiFetch('/api/avis', {
    method: 'POST',
    body: JSON.stringify({ note, commentaire })
  })
}
