'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  Lock,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  clearOrderSubmitted,
  isOrderSubmitted,
  loadChatSession,
  loadOrderSnapshot,
  markOrderSubmitted,
  streamConversation,
  updateOrderSnapshot,
  type StoredOrder,
} from '@/lib/chat-client'
import type { Order } from '@/lib/backend-types'
import { deliveryText, formatMoney } from '@/lib/order-utils'

function useLiveOrderUpdates(
  orderId: string,
  snapshot: StoredOrder | null,
  onOrder: (order: Order) => void,
) {
  useEffect(() => {
    if (!snapshot) return

    const chatSession = loadChatSession(snapshot.merchantSlug)
    if (!chatSession) return

    const controller = new AbortController()
    let active = true
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const connect = async () => {
      try {
        await streamConversation(
          snapshot.merchantSlug,
          chatSession,
          (event) => {
            if (event.type === 'order_update' && event.order.id === orderId) {
              updateOrderSnapshot(event.order)
              onOrder(event.order)
            }
          },
          controller.signal,
        )
      } catch {
        // The checkout still works without a live connection.
      }

      if (!active) return
      retryTimer = setTimeout(connect, 4000)
    }

    void connect()

    return () => {
      active = false
      controller.abort()
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [orderId, snapshot?.merchantSlug, onOrder])
}

function Header({ storeHref }: { storeHref?: string }) {
  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <a href={storeHref ?? '/'} className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-[6px] bg-primary text-primary-foreground">
            <Sparkles className="size-3.5" strokeWidth={1.5} />
          </div>
          <span className="font-serif text-lg font-semibold lowercase tracking-tight">Plauda</span>
        </a>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" /> Secure checkout
        </span>
      </div>
    </header>
  )
}

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Loading checkout…
      </div>
    </div>
  )
}

function MissingOrder() {
  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(217,70,31,0.10),transparent_70%)]">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <Package className="size-7" />
        </div>
        <h1 className="mt-6 font-serif text-3xl tracking-tight">Order not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This order is not available in this browser. Return to the chat where you created it, or
          open the store’s link again.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-primary-gradient px-6 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
        >
          Back to Plauda
        </a>
      </main>
    </div>
  )
}

function PaidState({ snapshot }: { snapshot: StoredOrder }) {
  const { order, merchantName, merchantSlug } = snapshot
  return (
    <div className="mx-auto mt-10 max-w-lg text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-300">
        <Check className="size-7" />
      </div>
      <h1 className="mt-6 font-serif text-3xl tracking-tight">Payment confirmed</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Order <span className="font-mono text-foreground">{order.id}</span> has been paid.
      </p>
      <Card className="relative mt-8 overflow-hidden rounded-[10px] text-left">
        <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--primary),transparent)]" />
        <CardContent className="space-y-3 p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total paid</span>
            <span className="font-mono font-semibold">
              {formatMoney(order.total, order.currency)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-right">{deliveryText(order.delivery_details)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Store</span>
            <span>{merchantName}</span>
          </div>
        </CardContent>
      </Card>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <a
          href={`/chat/${merchantSlug}`}
          className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-primary-gradient px-6 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
        >
          Return to chat
        </a>
        <a
          href={`/store/${merchantSlug}`}
          className="inline-flex h-10 items-center justify-center rounded-full border px-6 text-sm font-medium transition-colors hover:bg-muted"
        >
          Visit store
        </a>
      </div>
    </div>
  )
}

function SubmittedState({ snapshot }: { snapshot: StoredOrder | null }) {
  const merchantSlug = snapshot?.merchantSlug
  const order = snapshot?.order
  return (
    <div className="mx-auto mt-10 max-w-lg text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-amber-500/10 text-amber-300">
        <Clock className="size-7" />
      </div>
      <h1 className="mt-6 font-serif text-3xl tracking-tight">Payment submitted</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        We’re confirming your payment with PayPal. This page can be refreshed safely.
        {merchantSlug ? ' Return to the chat for live updates.' : ''}
      </p>
      {order && (
        <Card className="relative mt-8 overflow-hidden rounded-[10px] text-left">
          <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--primary),transparent)]" />
          <CardContent className="space-y-3 p-5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order</span>
              <span className="font-mono">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono font-semibold">
                {formatMoney(order.total, order.currency)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-right">{deliveryText(order.delivery_details)}</span>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        {merchantSlug && (
          <a
            href={`/chat/${merchantSlug}`}
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-primary-gradient px-6 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
          >
            Return to chat
          </a>
        )}
        <a
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-full border px-6 text-sm font-medium transition-colors hover:bg-muted"
        >
          Back to Plauda
        </a>
      </div>
    </div>
  )
}

export function CheckoutPage({ orderId }: { orderId: string }) {
  const [snapshot, setSnapshot] = useState<StoredOrder | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSnapshot(loadOrderSnapshot(orderId))
    setSubmitted(isOrderSubmitted(orderId))
    setLoaded(true)
  }, [orderId])

  const onOrder = useCallback((order: Order) => {
    setSnapshot((current) => (current ? { ...current, order } : current))
  }, [])

  useLiveOrderUpdates(orderId, snapshot, onOrder)

  if (!loaded) return <LoadingScreen />
  if (!snapshot) return <MissingOrder />

  const { order, merchantName, merchantSlug } = snapshot
  const storeHref = `/store/${merchantSlug}`
  const chatHref = `/chat/${merchantSlug}`
  const paid = order.status === 'paid' || order.status === 'fulfilled'
  const cancelled = order.status === 'cancelled' || order.status === 'expired'
  const canPay = order.status === 'pending_payment' && Boolean(order.approval_link)
  const delivery = order.delivery_details
  const deliveryHeadline = delivery
    ? [delivery.zone_name, delivery.eta_days ? `${delivery.eta_days}-day delivery` : null]
        .filter(Boolean)
        .join(' · ') || 'Delivery details saved'
    : 'Delivery not set'

  const pay = () => {
    if (!order.approval_link) {
      setError('The payment link is not ready yet. Return to the chat and ask the assistant to create it.')
      return
    }
    window.location.assign(order.approval_link)
  }

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(217,70,31,0.10),transparent_70%)]">
      <Header storeHref={storeHref} />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <a
            href={chatHref}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back to chat
          </a>
          <a href={storeHref} className="transition-colors hover:text-foreground">
            Visit {merchantName}
          </a>
        </div>

        {paid ? (
          <PaidState snapshot={snapshot} />
        ) : cancelled ? (
          <div className="mx-auto mt-10 max-w-lg text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
              <Package className="size-7" />
            </div>
            <h1 className="mt-6 font-serif text-3xl tracking-tight">This order is unavailable</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Order <span className="font-mono text-foreground">{order.id}</span> is{' '}
              {order.status}. Return to the chat if you would like to start a new order.
            </p>
            <a
              href={chatHref}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-primary-gradient px-6 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              Return to chat
            </a>
          </div>
        ) : submitted ? (
          <SubmittedState snapshot={snapshot} />
        ) : (
          <>
            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                Checkout
              </p>
              <h1 className="mt-1 font-serif text-3xl tracking-tight sm:text-4xl">
                <span className="text-gradient-primary">Review your order</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Order <span className="font-mono text-foreground">{order.id}</span> with{' '}
                {merchantName}.
              </p>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-6">
                <Card className="rounded-[10px]">
                  <CardHeader className="border-b px-5 py-4">
                    <CardTitle className="text-base">Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    {order.items.map((item, index) => (
                      <div
                        key={`${item.product_id ?? item.name}-${index}`}
                        className="flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="grid size-11 place-items-center rounded-[8px] border border-border/50 bg-gradient-to-br from-secondary to-accent">
                            <Package className="size-4 text-muted-foreground/60" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.variant?.name ?? 'Standard'} · Qty {item.qty}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm">
                            {formatMoney(item.unit_price, order.currency)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">each</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[10px] border border-border/60 bg-card p-5">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      <Truck className="size-3.5" /> Delivery
                    </p>
                    <p className="mt-3 text-sm">{deliveryHeadline}</p>
                    {delivery?.address && (
                      <p className="mt-1 text-sm text-muted-foreground">{delivery.address}</p>
                    )}
                  </div>
                  <div className="rounded-[10px] border border-border/60 bg-card p-5">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      <ShieldCheck className="size-3.5" /> Payment
                    </p>
                    <p className="mt-3 text-sm">Pay securely with PayPal</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Plauda never sees your card details.
                    </p>
                  </div>
                </div>
              </div>

              <aside>
                <Card className="relative overflow-hidden rounded-[10px] lg:sticky lg:top-6">
                  <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--primary),transparent)]" />
                  <CardHeader className="px-5 py-4">
                    <CardTitle className="text-base">Order summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-5 pb-5 pt-0 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-mono">
                        {formatMoney(order.subtotal, order.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery</span>
                      <span className="font-mono">
                        {formatMoney(order.delivery_fee, order.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-3 text-base font-semibold">
                      <span>Total</span>
                      <span className="font-mono">
                        {formatMoney(order.total, order.currency)}
                      </span>
                    </div>

                    <Button
                      className="mt-2 h-11 w-full rounded-[6px]"
                      onClick={pay}
                      disabled={!canPay}
                    >
                      {canPay
                        ? `Pay ${formatMoney(order.total, order.currency)} with PayPal`
                        : 'Payment link not ready'}
                    </Button>

                    {!canPay && (
                      <p className="text-center text-[11px] text-muted-foreground">
                        {order.status === 'confirmed'
                          ? 'Ask the assistant in chat to create your payment link.'
                          : 'The assistant is still preparing this order.'}
                      </p>
                    )}
                    {error && <p className="text-center text-[11px] text-destructive">{error}</p>}
                    <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-muted-foreground">
                      <Lock className="size-3" /> Secure payment powered by PayPal.
                    </p>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function NotCompletedState({
  orderId,
  snapshot,
  cancelled,
}: {
  orderId: string | null
  snapshot: StoredOrder | null
  cancelled: boolean
}) {
  return (
    <div className="mx-auto mt-10 max-w-lg text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <Clock className="size-7" />
      </div>
      <h1 className="mt-6 font-serif text-3xl tracking-tight">
        {cancelled ? 'Payment cancelled' : 'Payment not completed'}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {cancelled
          ? 'Your order is still waiting if you would like to try again.'
          : 'We could not find a completed payment for this order. If you cancelled, you can try again.'}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        {orderId && snapshot && (
          <a
            href={`/checkout/${orderId}`}
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-primary-gradient px-6 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
          >
            Return to checkout
          </a>
        )}
        {snapshot && (
          <a
            href={`/chat/${snapshot.merchantSlug}`}
            className="inline-flex h-10 items-center justify-center rounded-full border px-6 text-sm font-medium transition-colors hover:bg-muted"
          >
            Return to chat
          </a>
        )}
        {!snapshot && (
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-primary-gradient px-6 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
          >
            Back to Plauda
          </a>
        )}
      </div>
    </div>
  )
}

export function CheckoutResultPage() {
  const [orderId, setOrderId] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<StoredOrder | null>(null)
  const [approved, setApproved] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('order_id')
    const payerId = params.get('PayerID') ?? params.get('payerId')
    const wasCancelled = params.get('status') === 'cancel'

    if (id) {
      setSnapshot(loadOrderSnapshot(id))
      if (payerId && !wasCancelled) {
        markOrderSubmitted(id)
        setApproved(true)
      } else {
        clearOrderSubmitted(id)
      }
    }

    setOrderId(id)
    setCancelled(wasCancelled)
    setLoaded(true)
  }, [])

  const onOrder = useCallback((order: Order) => {
    setSnapshot((current) => (current ? { ...current, order } : current))
  }, [])

  useLiveOrderUpdates(orderId ?? '', snapshot, onOrder)

  if (!loaded) return <LoadingScreen />

  const paid = snapshot?.order.status === 'paid' || snapshot?.order.status === 'fulfilled'

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(217,70,31,0.10),transparent_70%)]">
      <Header storeHref={snapshot ? `/store/${snapshot.merchantSlug}` : '/'} />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {paid ? (
          <PaidState snapshot={snapshot!} />
        ) : approved ? (
          <SubmittedState snapshot={snapshot} />
        ) : (
          <NotCompletedState orderId={orderId} snapshot={snapshot} cancelled={cancelled} />
        )}
      </main>
    </div>
  )
}
