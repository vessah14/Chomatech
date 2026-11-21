import { apiFetch } from './client'

export function getUsers () {
  return apiFetch('/api/users')
}

export function updateUser (id, data) {
  return apiFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function updateUserRole (id, role) {
  return apiFetch(`/api/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  })
}

export function deleteUser (id) {
  return apiFetch(`/api/users/${id}`, { method: 'DELETE' })
}
