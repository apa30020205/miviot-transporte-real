import { apiDelete, apiGet, apiPost, apiPut } from './client'

export function fetchTalleres() {
  return apiGet('/taller')
}

export function createTaller(body) {
  return apiPost('/taller', body)
}

export function updateTaller(id, body) {
  return apiPut(`/taller/${id}`, body)
}

export function deleteTaller(id) {
  return apiDelete(`/taller/${id}`)
}
