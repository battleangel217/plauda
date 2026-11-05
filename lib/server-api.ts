import { backendFetch, BackendError } from '@/lib/backend'
import type { PublicStoreMeta } from '@/lib/backend-types'

const ATTEMPTS = 2
const REQUEST_TIMEOUT_MS = 8_000
const RETRY_DELAY_MS = 300

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function readDetail(response: Response) {
  let detail = `Store request failed with ${response.status}`
  try {
    const body = (await response.json()) as { detail?: unknown }
    if (typeof body.detail === 'string') detail = body.detail
  } catch {
    // Keep the status-based message.
  }
  return detail
}

export async function getPublicStoreMeta(slug: string): Promise<PublicStoreMeta> {
  const path = `/public/chat/${encodeURIComponent(slug)}/meta`
  let lastError: unknown = null

  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await backendFetch(path, { signal: controller.signal })
      if (response.ok) {
        return (await response.json()) as PublicStoreMeta
      }

      const error = new BackendError(response.status, await readDetail(response))
      if (response.status < 500 || attempt === ATTEMPTS - 1) throw error
      lastError = error
    } catch (caught) {
      if (caught instanceof BackendError && caught.status < 500) throw caught
      lastError = caught
      if (attempt === ATTEMPTS - 1) throw caught
    } finally {
      clearTimeout(timer)
    }

    await sleep(RETRY_DELAY_MS * (attempt + 1))
  }

  throw lastError instanceof Error ? lastError : new Error('Store request failed')
}
