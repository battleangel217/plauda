import {
  demoCheckout,
  demoOrder,
  extraProducts,
  initialMessages,
  merchant,
  products,
} from '@/lib/mock'
import type {
  ChatReply,
  CheckoutSnapshot,
  PaymentResult,
  StoreSnapshot,
} from '@/lib/types'

const API_BASE = process.env.BACKEND_API_URL?.replace(/\/$/, '')
const API_KEY = process.env.BACKEND_API_KEY

async function backend<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_BASE) return null

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(API_KEY ? { authorization: `Bearer ${API_KEY}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Backend request failed with ${response.status}`)
  }

  return (await response.json()) as T
}

export async function getStore(slug: string): Promise<StoreSnapshot> {
  const remote = await backend<StoreSnapshot>(`/stores/${slug}`)
  if (remote) return remote

  return {
    merchant: { ...merchant, slug },
    products: [...products, ...extraProducts].filter((product) => product.active),
    delivery: {
      label: 'Standard delivery',
      eta: '3–5 business days',
      fee: 6,
    },
    chat: {
      messages: initialMessages,
      order: demoOrder,
    },
  }
}

export async function getOrder(orderId: string): Promise<CheckoutSnapshot> {
  const remote = await backend<CheckoutSnapshot>(`/orders/${orderId}`)
  if (remote) return remote

  return {
    order: { ...demoOrder, id: orderId },
    merchant,
    customer: demoCheckout,
  }
}

export async function payOrder(orderId: string): Promise<PaymentResult> {
  const remote = await backend<PaymentResult>(`/orders/${orderId}/pay`, { method: 'POST' })
  if (remote) return remote

  return {
    order: { ...demoOrder, id: orderId, status: 'paid' },
    payment: {
      status: 'paid',
      paidAt: 'Just now',
      paypalId: 'DEMO-PAYPAL',
    },
  }
}

export async function sendChatMessage(
  slug: string,
  message: string,
  sessionId?: string,
): Promise<ChatReply> {
  const remote = await backend<ChatReply>(`/stores/${slug}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, sessionId }),
  })
  if (remote) return remote

  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    sessionId: sessionId ?? `demo-${slug}`,
    messages: [
      {
        id: `${Date.now()}a`,
        role: 'agent',
        text: 'I’m checking that for you now. We have it in stock and can have it on the way this week.',
        time: 'Now',
      },
    ],
    order: demoOrder,
  }
}
