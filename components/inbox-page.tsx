'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Inbox,
  Loader2,
  MessageCircle,
  Send,
  UserRound,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RichText } from '@/components/rich-text'
import { merchantJson, merchantSse } from '@/lib/merchant-client'
import type {
  ApiMessage,
  ConversationDetail,
  ConversationPage,
  ConversationStatus,
  ConversationSummaryOut,
  MessagePage,
  Order,
} from '@/lib/backend-types'

type Filter = 'all' | 'attention' | 'active' | 'closed'

type LiveEvent =
  | { type: 'message'; conversation_id: string; message: ApiMessage }
  | { type: 'conversation_update'; conversation: ConversationSummaryOut }
  | { type: 'order_update'; order: Order }

const statusLabels: Record<ConversationStatus, string> = {
  ai: 'AI active',
  handoff_requested: 'Needs attention',
  human_active: 'Human active',
  closed: 'Closed',
}

const statusDot: Record<ConversationStatus, string> = {
  ai: 'bg-emerald-500',
  handoff_requested: 'bg-amber-500',
  human_active: 'bg-blue-500',
  closed: 'bg-muted-foreground',
}

function StatusBadge({ status }: { status: ConversationStatus }) {
  return (
    <Badge variant="secondary" className="rounded-full px-2 py-1 text-[10px] font-medium">
      <span className={`mr-1.5 inline-block size-1.5 rounded-full ${statusDot[status]}`} />
      {statusLabels[status]}
    </Badge>
  )
}

function formatTime(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function relativeTime(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function mergeConversation(
  conversations: ConversationSummaryOut[],
  next: ConversationSummaryOut,
) {
  const exists = conversations.some((conversation) => conversation.id === next.id)
  if (!exists) return [next, ...conversations]
  return conversations.map((conversation) =>
    conversation.id === next.id ? { ...conversation, ...next } : conversation,
  )
}

function MessageBubble({ message }: { message: ApiMessage }) {
  if (message.role === 'system') {
    if (message.meta?.kind === 'payment') {
      return (
        <div className="flex justify-center py-2">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-300">
            <Check className="size-3.5" />
            {message.content}
          </div>
        </div>
      )
    }
    return <div className="py-2 text-center text-[11px] text-muted-foreground">{message.content}</div>
  }

  if (message.role === 'tool') {
    return (
      <div className="flex justify-center py-1">
        <span className="flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1 text-[11px] text-muted-foreground">
          <Check className="size-3" />
          {message.content}
        </span>
      </div>
    )
  }

  const customer = message.role === 'customer'
  const staff = message.role === 'staff'
  return (
    <div className={`flex ${customer ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[82%] ${customer ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-[10px] px-4 py-2.5 text-sm leading-relaxed ${
            customer
              ? 'rounded-br-sm bg-primary text-primary-foreground'
              : 'rounded-bl-sm border bg-card'
          }`}
        >
          <div className="break-words">
            <RichText text={message.content} />
          </div>
        </div>
        <span className="px-1 text-[10px] text-muted-foreground">
          {staff ? 'You' : customer ? 'Customer' : 'AI assistant'} · {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
      <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
    </div>
  )
}

export function InboxPage() {
  const [conversations, setConversations] = useState<ConversationSummaryOut[]>([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)
  const selectedRef = useRef('')

  useEffect(() => {
    selectedRef.current = selectedId
  }, [selectedId])

  const loadConversations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const page = await merchantJson<ConversationPage>('/conversations?limit=100')
      setConversations(page.items)
      setTotal(page.total)
      const requested = new URLSearchParams(window.location.search).get('conversation')
      const initial =
        requested && page.items.some((conversation) => conversation.id === requested)
          ? requested
          : window.innerWidth >= 1024 && page.items[0]
            ? page.items[0].id
            : ''
      if (initial) setSelectedId((current) => current || initial)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load conversations.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadThread = useCallback(async (id: string) => {
    setThreadLoading(true)
    setError('')
    try {
      const [nextDetail, page] = await Promise.all([
        merchantJson<ConversationDetail>(`/conversations/${encodeURIComponent(id)}`),
        merchantJson<MessagePage>(`/conversations/${encodeURIComponent(id)}/messages?limit=100`),
      ])
      setDetail(nextDetail)
      setMessages(page.items)
      setDraft('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load this conversation.')
      setDetail(null)
      setMessages([])
    } finally {
      setThreadLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (selectedId) void loadThread(selectedId)
    else {
      setDetail(null)
      setMessages([])
    }
  }, [loadThread, selectedId])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    let retry: ReturnType<typeof setTimeout> | undefined

    const connect = async () => {
      try {
        await merchantSse(
          '/conversations/stream',
          (event) => {
            const live = event as LiveEvent
            if (live.type === 'message') {
              setConversations((current) =>
                current.map((conversation) =>
                  conversation.id === live.conversation_id
                    ? { ...conversation, last_message_at: live.message.created_at }
                    : conversation,
                ),
              )
              if (live.conversation_id === selectedRef.current) {
                setMessages((current) =>
                  current.some((message) => message.id === live.message.id)
                    ? current
                    : [...current, live.message],
                )
              }
            } else if (live.type === 'conversation_update') {
              setConversations((current) => mergeConversation(current, live.conversation))
              if (live.conversation.id === selectedRef.current) {
                setDetail((current) =>
                  current ? { ...current, ...live.conversation } : current,
                )
              }
            }
          },
          controller.signal,
        )
      } catch {
        // The inbox still works without a live connection.
      }

      if (!active) return
      retry = setTimeout(connect, 4000)
    }

    void connect()

    return () => {
      active = false
      controller.abort()
      if (retry) clearTimeout(retry)
    }
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const filtered = useMemo(() => {
    const base =
      filter === 'all'
        ? conversations
        : filter === 'attention'
          ? conversations.filter((item) => item.status === 'handoff_requested')
          : filter === 'active'
            ? conversations.filter((item) => item.status === 'human_active')
            : conversations.filter((item) => item.status === 'closed')
    return [...base].sort((a, b) => {
      const left = new Date(a.last_message_at ?? a.started_at).getTime()
      const right = new Date(b.last_message_at ?? b.started_at).getTime()
      return right - left
    })
  }, [conversations, filter])

  const counts = useMemo(
    () => ({
      all: conversations.length,
      attention: conversations.filter((item) => item.status === 'handoff_requested').length,
      active: conversations.filter((item) => item.status === 'human_active').length,
      closed: conversations.filter((item) => item.status === 'closed').length,
    }),
    [conversations],
  )

  const choose = (id: string) => {
    setSelectedId(id)
    const url = new URL(window.location.href)
    url.searchParams.set('conversation', id)
    window.history.replaceState(null, '', url)
  }

  const backToList = () => {
    setSelectedId('')
    const url = new URL(window.location.href)
    url.searchParams.delete('conversation')
    window.history.replaceState(null, '', url)
  }

  const updateConversation = (next: ConversationDetail) => {
    setDetail(next)
    setConversations((current) => mergeConversation(current, next))
  }

  const accept = async () => {
    if (!detail || busy) return
    setBusy('accept')
    setError('')
    try {
      const next = await merchantJson<ConversationDetail>(
        `/conversations/${encodeURIComponent(detail.id)}/accept`,
        { method: 'POST' },
      )
      updateConversation(next)
      await loadThread(detail.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not accept this handoff.')
    } finally {
      setBusy('')
    }
  }

  const reply = async () => {
    const content = draft.trim()
    if (!detail || !content || busy) return
    setBusy('reply')
    setError('')
    try {
      const message = await merchantJson<ApiMessage>(
        `/conversations/${encodeURIComponent(detail.id)}/messages`,
        { method: 'POST', body: JSON.stringify({ content }) },
      )
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message],
      )
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === detail.id
            ? { ...conversation, last_message_at: message.created_at }
            : conversation,
        ),
      )
      setDraft('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not send your reply.')
    } finally {
      setBusy('')
    }
  }

  const runConversationAction = async (name: 'return-to-ai' | 'close') => {
    if (!detail || busy) return
    setBusy(name)
    setError('')
    try {
      const next = await merchantJson<ConversationDetail>(
        `/conversations/${encodeURIComponent(detail.id)}/${name}`,
        { method: 'POST' },
      )
      updateConversation(next)
      await loadThread(detail.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update this conversation.')
    } finally {
      setBusy('')
    }
  }

  const selected = detail
  const canReply = selected?.status === 'human_active'

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="border-b px-4 py-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Inbox
            </p>
            <h1 className="mt-1 text-3xl">Conversations</h1>
            <span className="mt-3 block h-px w-20 bg-[linear-gradient(90deg,var(--primary),transparent)]" />
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {total} conversation{total === 1 ? '' : 's'}
          </p>
        </div>
        <div className="mt-5 flex gap-1 overflow-x-auto border-b pb-1">
          {(
            [
              ['all', 'All'],
              ['attention', 'Needs attention'],
              ['active', 'Human active'],
              ['closed', 'Closed'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`whitespace-nowrap rounded-[6px] px-3 py-2 text-xs ${
                filter === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {label}{' '}
              <span className="ml-1 font-mono opacity-70">{counts[value]}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-[8px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive md:mx-8">
          <span>{error}</span>
          <button onClick={() => setError('')} aria-label="Dismiss error">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="grid flex-1 lg:grid-cols-[320px_minmax(0,1fr)_280px]">
        <aside className={`${selectedId ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-r`}>
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {filter === 'all' ? 'All chats' : filter === 'attention' ? 'Needs attention' : filter === 'active' ? 'Human active' : 'Closed'}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">{filtered.length}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <Loading />
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                <Inbox className="size-7 text-muted-foreground" />
                <p className="text-sm font-medium">No conversations here</p>
                <p className="text-xs text-muted-foreground">
                  Chats from your storefront will appear in this inbox.
                </p>
              </div>
            ) : (
              filtered.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => choose(conversation.id)}
                  className={`flex w-full flex-col gap-2 border-b px-4 py-4 text-left transition-colors ${
                    selectedId === conversation.id ? 'bg-muted/60' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {conversation.customer_name || 'Anonymous visitor'}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {relativeTime(conversation.last_message_at)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {conversation.customer_contact ||
                      conversation.handoff_reason ||
                      'Storefront chat'}
                  </p>
                  <StatusBadge status={conversation.status} />
                </button>
              ))
            )}
          </div>
        </aside>

        <section className={`${selectedId ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col`}>
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <MessageCircle className="size-9 text-muted-foreground" />
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Open a chat to see the customer, the assistant&apos;s replies, and any order it created.
              </p>
            </div>
          ) : threadLoading ? (
            <Loading />
          ) : selected ? (
            <>
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <button
                  onClick={backToList}
                  className="rounded p-1 hover:bg-muted lg:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-semibold">
                      {selected.customer_name || 'Anonymous visitor'}
                    </h2>
                    <StatusBadge status={selected.status} />
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {selected.customer_contact || selected.id}
                  </p>
                </div>
                {selected.status === 'handoff_requested' && (
                  <Button size="sm" onClick={() => void accept()} disabled={Boolean(busy)}>
                    {busy === 'accept' && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                    Accept
                  </Button>
                )}
                {selected.status === 'human_active' && (
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void runConversationAction('return-to-ai')}
                      disabled={Boolean(busy)}
                    >
                      {busy === 'return-to-ai' && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                      Return to AI
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void runConversationAction('close')}
                      disabled={Boolean(busy)}
                    >
                      Close
                    </Button>
                  </div>
                )}
                {selected.status === 'ai' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void runConversationAction('close')}
                    disabled={Boolean(busy)}
                  >
                    Close
                  </Button>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
                <div className="flex flex-col gap-2.5">
                  {messages.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      No messages yet.
                    </p>
                  ) : (
                    messages.map((message) => <MessageBubble key={message.id} message={message} />)
                  )}
                  <div ref={endRef} />
                </div>
              </div>

              <div className="border-t px-4 py-3">
                {selected.status === 'handoff_requested' && (
                  <p className="mb-2 text-xs text-amber-300">
                    {selected.handoff_reason || 'The customer asked for a human.'} Accept the handoff to reply.
                  </p>
                )}
                {selected.status === 'ai' && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    The AI is handling this conversation. You can step in after a handoff request.
                  </p>
                )}
                {selected.status === 'closed' && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    This conversation is closed. The customer can start a new chat.
                  </p>
                )}
                <div className="flex items-end gap-2 rounded-[10px] border bg-background p-2 shadow-sm">
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value.slice(0, 10_000))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                        event.preventDefault()
                        void reply()
                      }
                    }}
                    placeholder={canReply ? 'Reply as the store…' : 'Accept a handoff to reply'}
                    className="min-h-10 resize-none border-0 p-2 shadow-none focus-visible:ring-0"
                    maxLength={10_000}
                    disabled={!canReply || busy === 'reply'}
                  />
                  <Button
                    size="icon"
                    className="size-9 rounded-[6px]"
                    disabled={!canReply || !draft.trim() || busy === 'reply'}
                    onClick={() => void reply()}
                    aria-label="Send reply"
                  >
                    {busy === 'reply' ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
              Could not load this conversation.
            </div>
          )}
        </section>

        <aside className="hidden border-l xl:block">
          {selected ? (
            <div className="flex flex-col">
              <div className="border-b px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Customer
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="grid size-9 place-items-center rounded-full bg-muted">
                    <UserRound className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {selected.customer_name || 'Anonymous visitor'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selected.customer_contact || 'No contact shared'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Conversation
                </p>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Started</span>
                    <span className="text-right">{formatTime(selected.started_at)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Last message</span>
                    <span className="text-right">{formatTime(selected.last_message_at)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-right">{statusLabels[selected.status]}</span>
                  </div>
                </div>
              </div>

              {selected.handoff_reason && (
                <div className="border-b px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Handoff reason
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{selected.handoff_reason}</p>
                </div>
              )}

              {selected.latest_order_id && (
                <div className="border-b px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Latest order
                  </p>
                  <a
                    href={`/orders/${selected.latest_order_id}`}
                    className="mt-2 flex items-center justify-between gap-2 rounded-[6px] border px-3 py-2 text-xs hover:bg-muted/40"
                  >
                    <span className="truncate font-mono">{selected.latest_order_id}</span>
                    <ChevronRight className="size-3.5 shrink-0" />
                  </a>
                </div>
              )}

              <div className="px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Message count
                </p>
                <p className="mt-2 font-mono text-sm">{messages.length}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 text-xs text-muted-foreground">Select a conversation to see context.</div>
          )}
        </aside>
      </div>
    </div>
  )
}
