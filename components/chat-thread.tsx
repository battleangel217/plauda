'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, Check, CreditCard, Send, Sparkles, Users, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { sendChatMessage } from '@/lib/api'
import { demoOrder, initialMessages as demoMessages, merchant as demoMerchant } from '@/lib/mock'
import type { ChatMessage, Order, OrderStatus } from '@/lib/types'

const money = (value: number) => `$${value.toFixed(2)}`
const statusLabel: Record<string, string> = {
  pending_payment: 'Payment pending',
  paid: 'Paid',
  fulfilled: 'Fulfilled',
  confirmed: 'Confirmed',
  draft: 'Draft',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px] font-medium">
      {statusLabel[status] ?? status}
    </Badge>
  )
}

function Message({ message }: { message: ChatMessage }) {
  if (message.role === 'system' || message.role === 'tool') {
    return (
      <div className="flex justify-center py-1">
        <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[11px] text-muted-foreground">
          {message.role === 'tool' ? <Check className="size-3 text-[#3F6B4F]" /> : <CreditCard className="size-3" />}
          {message.text}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${message.role === 'customer' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-[10px] px-4 py-3 text-sm leading-relaxed ${
          message.role === 'customer'
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm border bg-background'
        }`}
      >
        {message.role === 'staff' && (
          <p className="mb-1 text-[10px] font-semibold text-muted-foreground">Team member</p>
        )}
        {message.text}
        <p
          className={`mt-1 text-[10px] ${
            message.role === 'customer' ? 'text-primary-foreground/60' : 'text-muted-foreground'
          }`}
        >
          {message.time}
        </p>
      </div>
    </div>
  )
}

function OrderCard({ order, status }: { order: Order; status: OrderStatus }) {
  return (
    <Card className="overflow-hidden rounded-[10px]">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b bg-background px-4 py-3">
        <div>
          <CardTitle className="text-sm">Your order</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {order.id} · {order.deliveryDetails}
          </p>
        </div>
        <StatusBadge status={status} />
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="space-y-2">
          {order.items.map((item, index) => (
            <div key={`${item.nameSnapshot}-${index}`} className="flex justify-between text-sm">
              <div>
                <span className="font-medium">{item.nameSnapshot}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {item.variantSnapshot} · Qty {item.qty}
                </span>
              </div>
              <span className="font-mono">{money(item.unitPrice)}</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Delivery</span>
            <span>{money(order.deliveryFee)}</span>
          </div>
          <div className="mt-1 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>
        </div>
        {status === 'pending_payment' ? (
          <>
            <a
              href={`/checkout/${order.id}`}
              className="flex h-9 w-full items-center justify-center rounded-[6px] bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Review &amp; pay
              <ArrowUpRight className="ml-1 size-4" />
            </a>
            <p className="text-center text-[10px] text-muted-foreground">
              Payment opens on a secure checkout page.
            </p>
          </>
        ) : (
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-[#3F6B4F]">
            <Check className="size-4" /> Payment confirmed
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface ChatThreadProps {
  merchantName?: string
  slug?: string
  initialMessages?: ChatMessage[]
  order?: Order
  showFooter?: boolean
  onClose?: () => void
}

export function ChatThread({
  merchantName = demoMerchant.name,
  slug,
  initialMessages = demoMessages,
  order: initialOrder = demoOrder,
  showFooter = true,
  onClose,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [human, setHuman] = useState(false)
  const [demo, setDemo] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [order, setOrder] = useState<Order>(initialOrder)
  const [hydrated, setHydrated] = useState(false)
  const storageKey = slug ? `plauda-chat:${slug}` : null
  const orderStatus: OrderStatus = demo === 3 ? 'paid' : order.status

  useEffect(() => {
    let nextMessages = initialMessages
    let nextSessionId: string | undefined
    let nextOrder = initialOrder

    if (storageKey) {
      try {
        const raw = window.localStorage.getItem(storageKey)
        if (raw) {
          const saved = JSON.parse(raw) as {
            messages?: ChatMessage[]
            sessionId?: string
            order?: Order
          }
          if (Array.isArray(saved.messages) && saved.messages.length > 0) {
            nextMessages = saved.messages
          }
          if (saved.sessionId) nextSessionId = saved.sessionId
          if (saved.order) nextOrder = saved.order
        }
      } catch {
        // Malformed state is ignored so the chat can recover.
      }
    }

    setMessages(nextMessages)
    setSessionId(nextSessionId)
    setOrder(nextOrder)
    setDraft('')
    setError(null)
    setHuman(false)
    setDemo(0)
    setHydrated(true)
  }, [storageKey, initialMessages, initialOrder])

  useEffect(() => {
    if (!storageKey || !hydrated) return

    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ messages, sessionId, order }))
    } catch {
      // Storage may be unavailable; the chat still works for this visit.
    }
  }, [storageKey, hydrated, messages, sessionId, order])

  const startNewChat = () => {
    if (storageKey) {
      try {
        window.localStorage.removeItem(storageKey)
      } catch {
        // Ignore storage errors.
      }
    }

    setMessages(initialMessages)
    setSessionId(undefined)
    setOrder(initialOrder)
    setDraft('')
    setError(null)
    setHuman(false)
    setDemo(0)
  }

  const send = async () => {
    const text = draft.trim()
    if (!text || streaming) return

    setError(null)
    setDraft('')
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-c`, role: 'customer', text, time: 'Now' },
    ])
    setStreaming(true)

    try {
      if (!slug) throw new Error('Store is not available')
      const reply = await sendChatMessage(slug, text, sessionId)
      setSessionId(reply.sessionId)
      if (reply.order) setOrder(reply.order)
      setMessages((current) => [...current, ...reply.messages])
    } catch {
      setError('Something went wrong. Please try again.')
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-a`,
          role: 'agent',
          text: 'I’m sorry, I couldn’t reach the assistant just now. Please try again in a moment.',
          time: 'Now',
        },
      ])
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="size-4" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold">{merchantName}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" /> AI assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setHuman(true)}>
            <Users className="mr-1.5 size-3.5" />
            <span className="hidden sm:inline">Talk to a human</span>
            <span className="sm:hidden">Human</span>
          </Button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close chat"
              className="grid size-8 place-items-center rounded-full transition-colors hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-5">
        {human && (
          <div className="rounded-[6px] border border-primary/20 bg-primary/5 px-3 py-2 text-center text-xs text-primary">
            A person from {merchantName} is taking over
          </div>
        )}

        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        <OrderCard order={order} status={orderStatus} />

        {streaming && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="rounded-[10px] rounded-bl-sm border bg-background px-4 py-3">
              <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-muted-foreground" />
              <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:120ms]" />
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:240ms]" />
            </div>
          </div>
        )}

        {human && (
          <Card className="border-dashed">
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-medium">No one is available right now</p>
              <div className="flex gap-2">
                <Input placeholder="Your name" />
                <Input placeholder="Email or phone" />
                <Button>Send</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="border-t bg-background px-4 py-3">
        {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
        <div className="flex items-end gap-2 rounded-[10px] border bg-background p-2 shadow-sm">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 500))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
                event.preventDefault()
                send()
              }
            }}
            placeholder="Ask about products, delivery, or your order…"
            className="min-h-10 resize-none border-0 p-2 shadow-none focus-visible:ring-0"
            maxLength={500}
          />
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] text-muted-foreground">{draft.length}/500</span>
            <Button size="icon" className="size-9 rounded-[6px]" disabled={streaming} onClick={send} aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </div>
        </div>
        <p className="mt-2 flex items-center justify-center gap-1 text-center text-[10px] text-muted-foreground">
          {showFooter && <><a href="/" className="underline">Powered by Plauda</a><span>·</span></>}
          <button
            className="underline"
            onClick={() => {
              const next = (demo + 1) % 5
              setDemo(next)
              setHuman(next === 4)
            }}
          >
            Demo mode
          </button>
          <span>·</span>
          <button className="underline" onClick={startNewChat}>
            New chat
          </button>
        </p>
      </div>
    </div>
  )
}
