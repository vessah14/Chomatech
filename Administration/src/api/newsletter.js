import { apiFetch } from './client'

export function getAbonnesNewsletter () {
  return apiFetch('/api/newsletter')
}

export function deleteAbonneNewsletter (id) {
  return apiFetch(`/api/newsletter/${id}`, { method: 'DELETE' })
}

export function envoyerNewsletter (sujet, contenu) {
  return apiFetch('/api/newsletter/envoyer', {
    method: 'POST',
    body: JSON.stringify({ sujet, contenu })
  })
}
