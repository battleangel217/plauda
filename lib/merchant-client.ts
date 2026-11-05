import { authHeaders } from '@/lib/auth-client'
import { readSseStream, toApiError } from '@/lib/sse'

function merchantPath(path: string) {
  return `/api/merchant${path.startsWith('/') ? path : `/${path}`}`
}

export async function merchantFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  for (const [key, value] of Object.entries(authHeaders())) headers.set(key, value)
  if (init.body && !(init.body instanceof FormData) && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  return fetch(merchantPath(path), {
    ...init,
    headers,
    cache: 'no-store',
  })
}

export async function merchantJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await merchantFetch(path, init)
  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function merchantSse(
  path: string,
  onEvent: (event: unknown) => void,
  signal: AbortSignal,
) {
  const response = await merchantFetch(path, { signal, headers: { accept: 'text/event-stream' } })
  if (!response.ok) throw await toApiError(response)
  await readSseStream(response, onEvent)
}
