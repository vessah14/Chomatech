import { apiFetch } from './client'

export function getKnowledgebase () {
  return apiFetch('/api/knowledgebase')
}

export function createKnowledgebaseEntry (data) {
  return apiFetch('/api/knowledgebase', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export function updateKnowledgebaseEntry (id, data) {
  return apiFetch(`/api/knowledgebase/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export function deleteKnowledgebaseEntry (id) {
  return apiFetch(`/api/knowledgebase/${id}`, { method: 'DELETE' })
}
