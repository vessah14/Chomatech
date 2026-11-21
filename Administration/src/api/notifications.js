import { apiFetch } from './client'

export function getNotifications () {
  return apiFetch('/api/notifications')
}

export function createNotification (data) {
  return apiFetch('/api/notifications', { method: 'POST', body: JSON.stringify(data) })
}

export function deleteNotification (id) {
  return apiFetch(`/api/notifications/${id}`, { method: 'DELETE' })
}
