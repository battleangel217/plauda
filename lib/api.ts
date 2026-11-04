import type { ChatReply, CheckoutSnapshot, PaymentResult, StoreSnapshot } from '@/lib/types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }

  return (await response.json()) as T
}

export function fetchStore(slug: string) {
  return request<StoreSnapshot>(`/api/store/${slug}`)
}

export function sendChatMessage(slug: string, message: string, sessionId?: string) {
  return request<ChatReply>(`/api/chat/${slug}`, {
    method: 'POST',
    body: JSON.stringify({ message, sessionId }),
  })
}

export function fetchOrder(orderId: string) {
  return request<CheckoutSnapshot>(`/api/orders/${orderId}`)
}

export function payOrder(orderId: string) {
  return request<PaymentResult>(`/api/orders/${orderId}/pay`, { method: 'POST' })
}
