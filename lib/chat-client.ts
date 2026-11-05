import type {
  ApiMessage,
  ChatTurnEvent,
  ConversationStatus,
  ConversationSummary,
  LiveEvent,
  MessagePage,
  Order,
  VisitorConversation,
} from '@/lib/backend-types'
import { readSseStream, toApiError } from '@/lib/sse'

export interface ChatSession {
  conversationId: string
  visitorToken: string
  status: ConversationStatus
  startedAt: string
  order: Order | null
}

export interface StoredOrder {
  order: Order
  merchantSlug: string
  merchantName: string
  savedAt: string
}

const chatKey = (slug: string) => `plauda-chat:${slug}`
const orderKey = (id: string) => `plauda-order:${id}`
const submittedKey = (id: string) => `plauda-order-submitted:${id}`

export function loadChatSession(slug: string): ChatSession | null {
  try {
    const raw = window.localStorage.getItem(chatKey(slug))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ChatSession>
    if (!parsed.conversationId || !parsed.visitorToken) {
      window.localStorage.removeItem(chatKey(slug))
      return null
    }
    return {
      conversationId: parsed.conversationId,
      visitorToken: parsed.visitorToken,
      status: parsed.status ?? 'ai',
      startedAt: parsed.startedAt ?? new Date().toISOString(),
      order: parsed.order ?? null,
    }
  } catch {
    return null
  }
}

export function saveChatSession(slug: string, session: ChatSession) {
  try {
    window.localStorage.setItem(chatKey(slug), JSON.stringify(session))
  } catch {
    // Storage is a convenience; the chat still works for this visit.
  }
}

export function clearChatSession(slug: string) {
  try {
    window.localStorage.removeItem(chatKey(slug))
  } catch {
    // Ignore storage errors.
  }
}

export function saveOrderSnapshot(
  order: Order,
  merchant: { slug: string; name: string },
) {
  try {
    const payload: StoredOrder = {
      order,
      merchantSlug: merchant.slug,
      merchantName: merchant.name,
      savedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(orderKey(order.id), JSON.stringify(payload))
  } catch {
    // Ignore storage errors.
  }
}

export function loadOrderSnapshot(orderId: string): StoredOrder | null {
  try {
    const raw = window.localStorage.getItem(orderKey(orderId))
    if (!raw) return null
    return JSON.parse(raw) as StoredOrder
  } catch {
    return null
  }
}

export function updateOrderSnapshot(order: Order) {
  try {
    const existing = loadOrderSnapshot(order.id)
    if (!existing) return null
    const next: StoredOrder = { ...existing, order }
    window.localStorage.setItem(orderKey(order.id), JSON.stringify(next))
    return next
  } catch {
    return null
  }
}

export function markOrderSubmitted(orderId: string) {
  try {
    window.localStorage.setItem(submittedKey(orderId), '1')
  } catch {
    // Ignore storage errors.
  }
}

export function clearOrderSubmitted(orderId: string) {
  try {
    window.localStorage.removeItem(submittedKey(orderId))
  } catch {
    // Ignore storage errors.
  }
}

export function isOrderSubmitted(orderId: string) {
  try {
    return window.localStorage.getItem(submittedKey(orderId)) === '1'
  } catch {
    return false
  }
}

function authHeaders(session: ChatSession, json = false) {
  const headers: Record<string, string> = {
    authorization: `Bearer ${session.visitorToken}`,
  }
  if (json) headers['content-type'] = 'application/json'
  return headers
}

export function sessionFromConversation(conversation: VisitorConversation): ChatSession {
  return {
    conversationId: conversation.conversation_id,
    visitorToken: conversation.visitor_token,
    status: conversation.status,
    startedAt: conversation.started_at,
    order: null,
  }
}

export async function createConversation(slug: string): Promise<ChatSession> {
  const response = await fetch(`/api/chat/${encodeURIComponent(slug)}/conversations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
  if (!response.ok) throw await toApiError(response)
  return sessionFromConversation((await response.json()) as VisitorConversation)
}

export async function fetchMessages(
  slug: string,
  session: ChatSession,
): Promise<ApiMessage[]> {
  const all: ApiMessage[] = []
  let offset = 0
  let total = Number.POSITIVE_INFINITY

  while (all.length < total && all.length < 500) {
    const params = new URLSearchParams({
      conversationId: session.conversationId,
      limit: '100',
      offset: String(offset),
    })
    const response = await fetch(
      `/api/chat/${encodeURIComponent(slug)}/messages?${params.toString()}`,
      { headers: authHeaders(session), cache: 'no-store' },
    )
    if (!response.ok) throw await toApiError(response)

    const page = (await response.json()) as MessagePage
    all.push(...page.items)
    total = page.total
    if (page.items.length === 0) break
    offset += page.items.length
  }

  return all
}

export async function sendChatTurn(
  slug: string,
  session: ChatSession,
  content: string,
  onEvent: (event: ChatTurnEvent) => void,
) {
  const response = await fetch(`/api/chat/${encodeURIComponent(slug)}/turn`, {
    method: 'POST',
    headers: authHeaders(session, true),
    body: JSON.stringify({
      conversation_id: session.conversationId,
      content,
    }),
  })
  if (!response.ok) throw await toApiError(response)
  await readSseStream(response, (event) => onEvent(event as ChatTurnEvent))
}

export async function requestHandoff(
  slug: string,
  session: ChatSession,
  reason?: string,
): Promise<ConversationSummary> {
  const response = await fetch(`/api/chat/${encodeURIComponent(slug)}/handoff`, {
    method: 'POST',
    headers: authHeaders(session, true),
    body: JSON.stringify({
      conversation_id: session.conversationId,
      ...(reason ? { reason } : {}),
    }),
  })
  if (!response.ok) throw await toApiError(response)
  return (await response.json()) as ConversationSummary
}

export async function streamConversation(
  slug: string,
  session: ChatSession,
  onEvent: (event: LiveEvent) => void,
  signal: AbortSignal,
) {
  const params = new URLSearchParams({ conversationId: session.conversationId })
  const response = await fetch(
    `/api/chat/${encodeURIComponent(slug)}/stream?${params.toString()}`,
    {
      headers: authHeaders(session),
      cache: 'no-store',
      signal,
    },
  )
  if (!response.ok) throw await toApiError(response)
  await readSseStream(response, (event) => onEvent(event as LiveEvent))
}
