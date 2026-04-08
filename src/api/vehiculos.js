import { apiDelete, apiGet, apiPost, apiPut } from './client'

export function fetchVehiculos() {
  return apiGet('/vehiculos')
}

export function createVehiculo(body) {
  return apiPost('/vehiculos', body)
}

export function updateVehiculo(id, body) {
  return apiPut(`/vehiculos/${id}`, body)
}

export function deleteVehiculo(id) {
  return apiDelete(`/vehiculos/${id}`)
}
