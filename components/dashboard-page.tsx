'use client'

import { useCallback, useEffect, useState } from 'react'
import { Shell } from '@/components/shell'
import {
  ArrowUpRight,
  BarChart3,
  Inbox,
  Package,
  Plus,
  ShoppingBag,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Reveal } from '@/components/reveal'
import { merchantJson } from '@/lib/merchant-client'
import { getStoredUser } from '@/lib/auth-client'
import type {
  DashboardSummary,
  MerchantOrderPage,
  MerchantOrderSummary,
  Product,
} from '@/lib/backend-types'
import { formatMoney, orderStatusLabel } from '@/lib/order-utils'

const statusColors: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  fulfilled: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  pending_payment: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  cancelled: 'bg-red-500/10 text-red-300 border-red-500/30',
  expired: 'bg-muted text-muted-foreground border-border',
  confirmed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  draft: 'bg-muted text-muted-foreground border-border',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
        statusColors[status] ?? 'bg-muted text-muted-foreground border-border'
      }`}
    >
      {orderStatusLabel[status] ?? status}
    </span>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function loadingCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <Card key={item} className="rounded-[10px]">
          <CardContent className="p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-4 h-7 w-28 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [orders, setOrders] = useState<MerchantOrderSummary[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [storeHref, setStoreHref] = useState('/')
  const [today, setToday] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextSummary, orderPage, nextProducts] = await Promise.all([
        merchantJson<DashboardSummary>('/dashboard/summary'),
        merchantJson<MerchantOrderPage>('/orders?limit=5'),
        merchantJson<Product[]>('/products'),
      ])
      setSummary(nextSummary)
      setOrders(orderPage.items)
      setProducts(nextProducts)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load your workspace.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const user = getStoredUser()
    if (user) setStoreHref(`/store/${user.merchant.slug}`)
    setToday(
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    )
  }, [])

  useEffect(() => {
    void load()
  }, [load, reloadKey])

  const stats = summary
    ? [
        {
          title: "Today's revenue",
          value: formatMoney(summary.revenue_today, summary.currency),
          detail: `${summary.paid_orders_today} paid order${summary.paid_orders_today === 1 ? '' : 's'} today`,
          icon: BarChart3,
        },
        {
          title: 'Orders today',
          value: String(summary.orders_today),
          detail: `${summary.pending_payment_orders} awaiting payment`,
          icon: ShoppingBag,
        },
        {
          title: 'Live chats',
          value: String(summary.live_chats),
          detail: `${summary.handoff_requests} need${
            summary.handoff_requests === 1 ? 's' : ''
          } a human`,
          icon: Inbox,
        },
        {
          title: 'Total revenue',
          value: formatMoney(summary.total_revenue, summary.currency),
          detail: `${summary.total_orders} order${summary.total_orders === 1 ? '' : 's'} all time`,
          icon: Zap,
        },
      ]
    : []

  return (
    <Shell>
      <main className="mx-auto max-w-7xl p-4 md:p-8">
        <Reveal className="mb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {today || 'Today'}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Overview</h1>
              <span className="mt-3 block h-px w-20 bg-[linear-gradient(90deg,var(--primary),transparent)]" />
            </div>
            <a href="/catalogue">
              <Button className="rounded-full">
                <Plus className="mr-2 size-4" />
                Add product
              </Button>
            </a>
          </div>
        </Reveal>

        {error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => setReloadKey((value) => value + 1)}>
              Try again
            </Button>
          </div>
        )}

        {loading && !summary ? (
          <Reveal>{loadingCards()}</Reveal>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ title, value, detail, icon: Icon }, index) => (
              <Reveal
                key={title}
                delay={index * 80}
                className="h-full min-w-0 [&>*]:h-full"
              >
                <Card className="relative rounded-[10px]">
                  <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--primary),transparent)] opacity-50" />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{title}</p>
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-2xl font-semibold">{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        )}

        <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Reveal className="h-full min-w-0 [&>*]:h-full">
            <Card className="relative h-full rounded-[10px]">
              <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--primary),transparent)] opacity-60" />
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent orders</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Your latest customer activity</p>
                </div>
                <a href="/orders">
                  <Button variant="ghost" size="sm">
                    View all <ArrowUpRight className="ml-1 size-3.5" />
                  </Button>
                </a>
              </CardHeader>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                    <div className="grid size-11 place-items-center rounded-full bg-muted">
                      <ShoppingBag className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No orders yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Orders your AI creates in chat will appear here.
                      </p>
                    </div>
                    <a href={storeHref} className="text-xs underline underline-offset-4">
                      Open your storefront
                    </a>
                  </div>
                ) : (
                  <div className="divide-y">
                    {orders.map((order) => (
                      <a
                        key={order.id}
                        href={`/orders/${order.id}`}
                        className="flex min-w-0 items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:gap-4 sm:px-6"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-[6px] bg-muted">
                            <ShoppingBag className="size-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {order.item_count} item{order.item_count === 1 ? '' : 's'}
                            </p>
                            <p className="truncate font-mono text-xs text-muted-foreground">
                              {order.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                          <span className="hidden text-xs text-muted-foreground sm:inline">
                            {formatDate(order.created_at)}
                          </span>
                          <StatusBadge status={order.status} />
                          <span className="font-mono text-sm font-medium">
                            {formatMoney(order.total, order.currency)}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={110} className="h-full min-w-0 [&>*]:h-full">
            <Card className="relative h-full rounded-[10px]">
              <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--primary),transparent)] opacity-60" />
              <CardHeader>
                <CardTitle className="text-base">Catalogue at a glance</CardTitle>
                <p className="text-sm text-muted-foreground">Products your AI can sell today</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {products.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="grid size-11 place-items-center rounded-full bg-muted">
                      <Package className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No products yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Add a product so your assistant can start selling.
                      </p>
                    </div>
                    <a href="/catalogue">
                      <Button size="sm" variant="outline">
                        <Plus className="mr-1.5 size-3.5" /> Add product
                      </Button>
                    </a>
                  </div>
                ) : (
                  products.slice(0, 4).map((product) => {
                    const stock = product.variants.reduce((sum, variant) => sum + variant.stock, 0)
                    return (
                      <a
                        key={product.id}
                        href="/catalogue"
                        className="flex items-center gap-3 transition-opacity hover:opacity-80"
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-[6px] border bg-muted">
                          <Package className="size-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.variants.length
                              ? `${stock} in stock`
                              : product.active
                                ? 'Active'
                                : 'Inactive'}
                          </p>
                        </div>
                        <span className="font-mono text-sm font-medium">
                          {formatMoney(product.price, product.currency)}
                        </span>
                      </a>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </main>
    </Shell>
  )
}
