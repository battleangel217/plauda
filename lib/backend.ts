const DEFAULT_BACKEND_API_URL = 'https://plauda.fastapicloud.dev'

export const BACKEND_API_URL = (
  process.env.BACKEND_API_URL || DEFAULT_BACKEND_API_URL
).replace(/\/$/, '')

export class BackendError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'BackendError'
    this.status = status
    this.detail = detail
  }
}

export function backendUrl(path: string) {
  return `${BACKEND_API_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export async function backendFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  if (!headers.has('accept')) headers.set('accept', 'application/json')

  return fetch(backendUrl(path), {
    ...init,
    headers,
    cache: 'no-store',
  })
}

async function readDetail(response: Response) {
  try {
    const body = (await response.json()) as { detail?: unknown }
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail)) {
      return body.detail
        .map((item) =>
          item && typeof item === 'object' && 'msg' in item
            ? String((item as { msg: unknown }).msg)
            : String(item),
        )
        .join(', ')
    }
  } catch {
    // The body was not JSON; fall through to a generic message.
  }
  return `Backend request failed with ${response.status}`
}

export async function backendJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await backendFetch(path, init)
  if (!response.ok) {
    throw new BackendError(response.status, await readDetail(response))
  }
  return (await response.json()) as T
}

export function jsonHeaders(request: Request, includeContentType = true) {
  const headers = new Headers()
  const authorization = request.headers.get('authorization')
  const accept = request.headers.get('accept')
  if (authorization) headers.set('authorization', authorization)
  if (accept) headers.set('accept', accept)
  if (includeContentType) headers.set('content-type', 'application/json')
  return headers
}

export async function proxyJsonRequest(request: Request, path: string, init?: RequestInit) {
  const response = await backendFetch(path, {
    ...init,
    headers: jsonHeaders(request),
  })
  if (response.status === 204 || response.status === 205 || response.status === 304) {
    return new Response(null, { status: response.status })
  }

  const body = await response.text()
  return new Response(body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  })
}

export async function proxySseRequest(
  request: Request,
  path: string,
  init?: Omit<RequestInit, 'headers'>,
) {
  const response = await backendFetch(path, {
    ...init,
    method: request.method,
    headers: {
      accept: 'text/event-stream',
      'content-type': 'application/json',
      ...(request.headers.get('authorization')
        ? { authorization: request.headers.get('authorization') as string }
        : {}),
    },
  })

  if (!response.ok) {
    const body = await response.text()
    return new Response(body, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') ?? 'application/json',
      },
    })
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  })
}
