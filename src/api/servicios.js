import { apiGet, apiPost, apiPut, apiDelete } from './client'

export function fetchServicios() {
  return apiGet('/servicios')
}

export function createServicio(body) {
  return apiPost('/servicios', body)
}

export function updateServicio(id, body) {
  return apiPut(`/servicios/${id}`, body)
}

export function deleteServicio(id) {
  return apiDelete(`/servicios/${id}`)
}
