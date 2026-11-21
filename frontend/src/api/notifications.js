import { apiFetch } from './client'

export function getMesNotifications (clientId) {
  return apiFetch(`/api/notifications?clientId=${clientId}`)
}

export function marquerNotificationLue (id) {
  return apiFetch(`/api/notifications/${id}/lu`, { method: 'PATCH' })
}
