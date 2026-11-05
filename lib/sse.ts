export interface ApiError extends Error {
  status?: number
  retryAfter?: number
}

export async function readSseStream(
  response: Response,
  onEvent: (event: unknown) => void,
) {
  if (!response.body) return

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')

    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)

      for (const line of frame.split('\n')) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (!data) continue
        try {
          onEvent(JSON.parse(data) as unknown)
        } catch {
          // Ignore malformed frames; the stream may have partial data.
        }
      }

      boundary = buffer.indexOf('\n\n')
    }
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  let detail = `Request failed with ${response.status}`
  try {
    const body = (await response.json()) as { detail?: unknown; error?: unknown }
    if (typeof body.detail === 'string') detail = body.detail
    else if (typeof body.error === 'string') detail = body.error
    else if (Array.isArray(body.detail)) {
      detail = body.detail
        .map((item) =>
          item && typeof item === 'object' && 'msg' in item
            ? String((item as { msg: unknown }).msg)
            : String(item),
        )
        .join(', ')
    }
  } catch {
    // Keep the status-based message.
  }

  const error = new Error(detail) as ApiError
  error.status = response.status
  const retryAfter = response.headers.get('retry-after')
  if (retryAfter) {
    const seconds = Number(retryAfter)
    if (Number.isFinite(seconds)) error.retryAfter = seconds
  }
  return error
}
