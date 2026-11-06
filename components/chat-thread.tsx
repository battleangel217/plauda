'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  CreditCard,
  Loader2,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  clearChatSession,
  createConversation,
  fetchMessages,
  loadChatSession,
  requestHandoff,
  saveChatSession,
  saveOrderSnapshot,
  sendChatTurn,
  streamConversation,
  type ChatSession,
} from '@/lib/chat-client'
import type {
  ApiMessage,
  ChatTurnEvent,
  ConversationStatus,
  LiveEvent,
  MessageRole,
  Order,
} from '@/lib/backend-types'
import { deliveryText, formatMoney, orderStatusLabel } from '@/lib/order-utils'
import { RichText } from '@/components/rich-text'
import type { ApiError } from '@/lib/sse'

type UiMessage = {
  id: string
  role: MessageRole
  text: string
  time: string
}

const conversationCopy: Record<
  ConversationStatus,
  { label: string; dot: string }
> = {
  ai: { label: 'AI assistant', dot: 'bg-emerald-500' },
  handoff_requested: { label: 'Waiting for the team', dot: 'bg-amber-500' },
  human_active: { label: 'Team member connected', dot: 'bg-blue-500' },
  closed: { label: 'Conversation closed', dot: 'bg-muted-foreground' },
}

function formatTime(value?: string) {
  if (!value) return 'Now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Now'
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function toUiMessage(message: ApiMessage): UiMessage {
  return {
    id: message.id,
    role: message.role,
    text: message.content,
    time: formatTime(message.created_at),
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px] font-medium">
      {orderStatusLabel[status] ?? status}
    </Badge>
  )
}

function Message({ message }: { message: UiMessage }) {
  if (message.role === 'system' || message.role === 'tool') {
    return (
      <div className="flex shrink-0 justify-center py-1">
        <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[11px] text-muted-foreground">
          {message.role === 'tool' ? (
            <Check className="size-3 text-emerald-400" />
          ) : (
            <CreditCard className="size-3" />
          )}
          {message.text}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex shrink-0 ${message.role === 'customer' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[88%] rounded-[10px] px-4 py-3 text-sm leading-relaxed ${
          message.role === 'customer'
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm border bg-background'
        }`}
      >
        {message.role === 'staff' && (
          <p className="mb-1 text-[10px] font-semibold text-muted-foreground">Team member</p>
        )}
        <RichText text={message.text} />
        <p
          className={`mt-1 text-[10px] ${
            message.role === 'customer'
              ? 'text-primary-foreground/60'
              : 'text-muted-foreground'
          }`}
        >
          {message.time}
        </p>
      </div>
    </div>
  )
}

function OrderCard({
  order,
  merchantName,
  slug,
}: {
  order: Order
  merchantName: string
  slug: string
}) {
  const canPay = order.status === 'pending_payment' && Boolean(order.approval_link)
  const paid = order.status === 'paid' || order.status === 'fulfilled'

  return (
    <Card className="shrink-0 overflow-hidden rounded-[10px]">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b bg-background px-4 py-3">
        <div className="min-w-0">
          <CardTitle className="text-sm">Your order</CardTitle>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {order.id}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {deliveryText(order.delivery_details)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="space-y-2">
          {order.items.map((item, index) => (
            <div
              key={`${item.product_id ?? item.name}-${index}`}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <div className="min-w-0">
                <span className="font-medium">{item.name}</span>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.variant?.name ?? 'Standard'} · Qty {item.qty} ·{' '}
                  {formatMoney(item.unit_price, order.currency)} each
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal, order.currency)}</span>
          </div>
          <div className="mt-1 flex justify-between text-muted-foreground">
            <span>Delivery</span>
            <span>{formatMoney(order.delivery_fee, order.currency)}</span>
          </div>
          <div className="mt-1 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatMoney(order.total, order.currency)}</span>
          </div>
        </div>

        {canPay ? (
          <>
            <a
              href={`/checkout/${order.id}`}
              onClick={() => saveOrderSnapshot(order, { slug, name: merchantName })}
              className="flex h-9 w-full items-center justify-center rounded-[6px] border border-white/10 bg-primary-gradient text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              Review &amp; pay
              <ArrowUpRight className="ml-1 size-4" />
            </a>
            <p className="text-center text-[10px] text-muted-foreground">
              Payment opens on a secure checkout page.
            </p>
          </>
        ) : paid ? (
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-300">
            <Check className="size-4" /> Payment confirmed
          </p>
        ) : order.status === 'confirmed' ? (
          <p className="text-center text-[11px] text-muted-foreground">
            Your order is confirmed. Ask the assistant to create your payment link when you are
            ready.
          </p>
        ) : order.status === 'cancelled' || order.status === 'expired' ? (
          <p className="text-center text-[11px] text-muted-foreground">
            This order is no longer available.
          </p>
        ) : (
          <p className="text-center text-[11px] text-muted-foreground">
            The assistant is building your order.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface ChatThreadProps {
  merchantName: string
  slug: string
  showFooter?: boolean
  onClose?: () => void
}

export function ChatThread({
  merchantName,
  slug,
  showFooter = true,
  onClose,
}: ChatThreadProps) {
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [order, setOrder] = useState<Order | null>(null)
  const [status, setStatus] = useState<ConversationStatus>('ai')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [sending, setSending] = useState(false)
  const [waitingForReply, setWaitingForReply] = useState(false)
  const [toolStatus, setToolStatus] = useState<string | null>(null)
  const [handoffLoading, setHandoffLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<ChatSession | null>(null)
  const systemCounter = useRef(0)

  const conversationState = conversationCopy[status]
  const canChat = Boolean(session) && status !== 'closed'
  const placeholder =
    status === 'closed'
      ? 'This conversation is closed.'
      : status === 'ai'
        ? 'Ask about products, delivery, or your order…'
        : 'Message the team…'

  const updateSession = useCallback(
    (patch: Partial<ChatSession>) => {
      setSession((current) => {
        if (!current) return current
        const next = { ...current, ...patch }
        saveChatSession(slug, next)
        sessionRef.current = next
        return next
      })
    },
    [slug],
  )

  const applyOrder = useCallback(
    (nextOrder: Order) => {
      setOrder(nextOrder)
      setSession((current) => {
        if (!current) return current
        const next = { ...current, order: nextOrder }
        saveChatSession(slug, next)
        sessionRef.current = next
        return next
      })
      saveOrderSnapshot(nextOrder, { slug, name: merchantName })
    },
    [merchantName, slug],
  )

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    let cancelled = false

    const beginNewConversation = async () => {
      const created = await createConversation(slug)
      if (cancelled) return
      saveChatSession(slug, created)
      sessionRef.current = created
      setSession(created)
      setStatus(created.status)
      setOrder(created.order)
      setMessages([])
    }

    const initialise = async () => {
      setLoading(true)
      setError(null)
      setConnectionError(null)

      const saved = loadChatSession(slug)
      if (saved) {
        sessionRef.current = saved
        setSession(saved)
        setStatus(saved.status)
        setOrder(saved.order)

        try {
          const history = await fetchMessages(slug, saved)
          if (cancelled) return
          setMessages(history.map(toUiMessage))

          const paymentMessage = history.find(
            (message) =>
              message.role === 'system' && message.meta?.kind === 'payment',
          )
          if (saved.order && paymentMessage) {
            const messageOrderId =
              typeof paymentMessage.meta.order_id === 'string'
                ? paymentMessage.meta.order_id
                : null
            if (
              (!messageOrderId || messageOrderId === saved.order.id) &&
              saved.order.status !== 'paid' &&
              saved.order.status !== 'fulfilled'
            ) {
              const paidOrder = { ...saved.order, status: 'paid' as const }
              applyOrder(paidOrder)
              saveChatSession(slug, { ...saved, order: paidOrder })
            }
          }
        } catch (caught) {
          if (cancelled) return
          const apiError = caught as ApiError
          if (apiError.status === 401 || apiError.status === 404) {
            clearChatSession(slug)
            try {
              await beginNewConversation()
            } catch {
              setError('We could not start the chat. Please try again.')
            }
          } else {
            setError('We could not load your conversation. Please refresh to try again.')
          }
        }
      } else {
        try {
          await beginNewConversation()
        } catch {
          if (!cancelled) setError('We could not start the chat. Please try again.')
        }
      }

      if (!cancelled) setLoading(false)
    }

    void initialise()

    return () => {
      cancelled = true
    }
  }, [slug, applyOrder])

  useEffect(() => {
    if (!session) return

    const controller = new AbortController()
    let active = true
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const handleLiveEvent = (event: LiveEvent) => {
      if (event.type === 'message') {
        const message = event.message
        if (message.role !== 'staff' && message.role !== 'system') return
        setMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, toUiMessage(message)],
        )
        return
      }

      if (event.type === 'conversation_update') {
        setStatus(event.conversation.status)
        updateSession({ status: event.conversation.status })
        return
      }

      if (event.type === 'order_update') {
        applyOrder(event.order)
      }
    }

    const connect = async () => {
      try {
        await streamConversation(slug, session, handleLiveEvent, controller.signal)
        if (active) setConnectionError('Live updates paused. Reconnecting…')
      } catch {
        if (controller.signal.aborted) return
        setConnectionError('Live updates paused. Reconnecting…')
      }

      if (!active) return
      retryTimer = setTimeout(connect, 3000)
    }

    void connect()

    return () => {
      active = false
      controller.abort()
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [slug, session?.conversationId, session?.visitorToken, applyOrder, updateSession])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, order, toolStatus, waitingForReply, status])

  const syncHistory = async (currentSession: ChatSession) => {
    try {
      const history = await fetchMessages(slug, currentSession)
      setMessages(history.map(toUiMessage))
    } catch {
      // Keep the streamed messages if the background sync fails.
    }
  }

  const send = async () => {
    const text = draft.trim()
    if (!text || sending || !session || status === 'closed') return

    setDraft('')
    setError(null)
    setToolStatus(null)
    setWaitingForReply(true)
    setSending(true)

    const customerMessage: UiMessage = {
      id: `${Date.now()}-customer`,
      role: 'customer',
      text,
      time: 'Now',
    }
    const assistantId = `${Date.now()}-assistant`
    let assistantStarted = false

    setMessages((current) => [...current, customerMessage])

    const appendDelta = (delta: string) => {
      if (!delta) return
      setMessages((current) => {
        const index = current.findIndex((message) => message.id === assistantId)
        if (index === -1) {
          return [
            ...current,
            { id: assistantId, role: 'agent', text: delta, time: 'Now' },
          ]
        }
        const next = current.slice()
        next[index] = { ...next[index], text: next[index].text + delta }
        return next
      })
    }

    const handleTurnEvent = (event: ChatTurnEvent) => {
      if (event.type === 'delta') {
        if (!assistantStarted) {
          assistantStarted = true
          setWaitingForReply(false)
        }
        appendDelta(event.text)
        return
      }

      if (event.type === 'tool_status') {
        setToolStatus(event.state === 'started' ? event.label : null)
        return
      }

      if (event.type === 'order_update') {
        applyOrder(event.order)
        return
      }

      if (event.type === 'system') {
        systemCounter.current += 1
        setMessages((current) => [
          ...current,
          {
            id: `${Date.now()}-system-${systemCounter.current}`,
            role: 'system',
            text: event.text,
            time: 'Now',
          },
        ])
        return
      }

      if (event.type === 'error') {
        setError(event.message)
      }
    }

    try {
      await sendChatTurn(slug, session, text, handleTurnEvent)
    } catch (caught) {
      const apiError = caught as ApiError
      if (apiError.status === 429) {
        setError('You are sending messages too quickly. Please wait a moment and try again.')
      } else if (apiError.status === 401 || apiError.status === 404) {
        setError('This conversation has expired. Start a new chat to continue.')
      } else {
        setError(apiError.message || 'The assistant could not reply. Please try again.')
      }
    } finally {
      setSending(false)
      setWaitingForReply(false)
      setToolStatus(null)
    }

    await syncHistory(session)
  }

  const requestHuman = async () => {
    if (!session || status !== 'ai' || handoffLoading) return

    setHandoffLoading(true)
    setError(null)
    try {
      const conversation = await requestHandoff(slug, session)
      updateSession({ status: conversation.status })
      setStatus(conversation.status)
      await syncHistory(session)
    } catch (caught) {
      const apiError = caught as ApiError
      setError(apiError.message || 'We could not reach the team. Please try again.')
    } finally {
      setHandoffLoading(false)
    }
  }

  const startNewChat = async () => {
    if (creating) return

    setCreating(true)
    setError(null)
    setConnectionError(null)
    setToolStatus(null)
    setWaitingForReply(false)
    clearChatSession(slug)
    setMessages([])
    setSession(null)
    setOrder(null)
    setStatus('ai')
    setDraft('')

    try {
      const created = await createConversation(slug)
      saveChatSession(slug, created)
      sessionRef.current = created
      setSession(created)
      setStatus(created.status)
      setOrder(created.order)
    } catch {
      setError('We could not start a new chat. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const humanButtonLabel =
    status === 'ai'
      ? handoffLoading
        ? 'Connecting…'
        : 'Talk to a human'
      : status === 'handoff_requested'
        ? 'Team notified'
        : status === 'human_active'
          ? 'Team connected'
          : 'Closed'

  const headerStatus = useMemo(() => {
    if (loading) return { label: 'Connecting…', dot: 'bg-amber-500' }
    return conversationState
  }, [conversationState, loading])

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full border border-white/10 bg-primary-gradient text-primary-foreground">
            <Sparkles className="size-4" strokeWidth={1.5} />
          </div>
          <div>
            <a
              href={`/store/${slug}`}
              className="text-sm font-semibold hover:underline"
            >
              {merchantName}
            </a>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className={`size-1.5 rounded-full ${headerStatus.dot}`} />{' '}
              {headerStatus.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={requestHuman}
            disabled={!session || status !== 'ai' || handoffLoading}
          >
            {handoffLoading ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Users className="mr-1.5 size-3.5" />
            )}
            <span className="hidden sm:inline">{humanButtonLabel}</span>
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

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="flex min-h-full flex-col gap-3">
          {status === 'handoff_requested' && (
            <div className="rounded-[6px] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-300">
              A person from {merchantName} has been notified and will reply here.
            </div>
          )}

          {status === 'human_active' && (
            <div className="rounded-[6px] border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-center text-xs text-blue-300">
              A person from {merchantName} is in this chat.
            </div>
          )}

          {status === 'closed' && (
            <div className="rounded-[6px] border bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
              This conversation is closed. Start a new chat to keep talking.
            </div>
          )}

          {connectionError && !loading && (
            <div className="rounded-[6px] border border-border bg-muted/40 px-3 py-2 text-center text-[11px] text-muted-foreground">
              {connectionError}
            </div>
          )}

          {loading || creating ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              {creating ? 'Starting a new chat…' : 'Opening chat…'}
            </div>
          ) : (
            <>
              {messages.length === 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-[10px] rounded-bl-sm border bg-background px-4 py-3 text-sm leading-relaxed">
                    <p>
                      Hi! I’m the AI assistant for {merchantName}. Ask me about products, delivery,
                      or an order.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}

              {order && <OrderCard order={order} merchantName={merchantName} slug={slug} />}

              {toolStatus && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-[11px] text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    {toolStatus}…
                  </div>
                </div>
              )}

              {waitingForReply && !toolStatus && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="rounded-[10px] rounded-bl-sm border bg-background px-4 py-3">
                    <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-muted-foreground" />
                    <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:120ms]" />
                    <span className="inline-block size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:240ms]" />
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t bg-background px-4 py-3">
        {error && (
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-destructive">
            <span>{error}</span>
            {(!session || !canChat) && (
              <button className="underline" onClick={startNewChat} disabled={creating}>
                Try again
              </button>
            )}
          </div>
        )}

        <div className="flex items-end gap-2 rounded-[10px] border bg-background p-2 shadow-sm">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 500))}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing &&
                event.keyCode !== 229
              ) {
                event.preventDefault()
                void send()
              }
            }}
            placeholder={placeholder}
            className="min-h-10 resize-none border-0 p-2 shadow-none focus-visible:ring-0"
            maxLength={500}
            disabled={!canChat || loading || creating}
          />
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] text-muted-foreground">{draft.length}/500</span>
            <Button
              size="icon"
              className="size-9 rounded-[6px]"
              disabled={!canChat || sending || loading || creating || !draft.trim()}
              onClick={() => void send()}
              aria-label="Send message"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </div>
        <p className="mt-2 flex items-center justify-center gap-1 text-center text-[10px] text-muted-foreground">
          {showFooter && (
            <>
              <a href="/" className="underline">
                Powered by Plauda
              </a>
              <span>·</span>
            </>
          )}
          <button className="underline" onClick={startNewChat} disabled={creating}>
            New chat
          </button>
        </p>
      </div>
    </div>
  )
}
