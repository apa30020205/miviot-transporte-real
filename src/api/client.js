const PREFIX = '/api'

async function handleJson(res) {
  const text = await res.text()
  if (!res.ok) {
    try {
      const j = JSON.parse(text)
      const msg = j.error || text || res.statusText
      throw new Error(typeof msg === 'string' ? msg : `Error ${res.status}`)
    } catch (e) {
      if (e instanceof Error && e.message) throw e
      throw new Error(text || `HTTP ${res.status}`)
    }
  }
  if (!text) return null
  return JSON.parse(text)
}

export async function apiGet(path) {
  const res = await fetch(`${PREFIX}${path}`)
  return handleJson(res)
}

export async function apiPost(path, body) {
  const res = await fetch(`${PREFIX}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return handleJson(res)
}

export async function apiPut(path, body) {
  const res = await fetch(`${PREFIX}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return handleJson(res)
}

export async function apiDelete(path) {
  const res = await fetch(`${PREFIX}${path}`, { method: 'DELETE' })
  if (res.status === 204) return null
  return handleJson(res)
}
