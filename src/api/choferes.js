import { apiDelete, apiGet, apiPost, apiPut } from './client'

export function fetchChoferes() {
  return apiGet('/choferes')
}

export function createChofer(body) {
  return apiPost('/choferes', body)
}

export function updateChofer(id, body) {
  return apiPut(`/choferes/${id}`, body)
}

export function deleteChofer(id) {
  return apiDelete(`/choferes/${id}`)
}
