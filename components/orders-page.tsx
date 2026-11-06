'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Package,
  ShoppingBag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { merchantJson } from '@/lib/merchant-client'
import type {
  AuditEntry,
  AuditPage,
  MerchantOrder,
  MerchantOrderPage,
  MerchantOrderSummary,
  OrderStatus,
} from '@/lib/backend-types'
import { deliveryText, formatMoney, orderStatusLabel } from '@/lib/order-utils'

type Filter = 'all' | OrderStatus

const filters: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'paid', label: 'Paid' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
]

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

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function PageShell({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <div>
        {onBack && (
          <div className="flex h-14 items-center border-b px-4 md:px-8">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to orders">
              <ArrowLeft className="size-4" />
            </Button>
            <span className="ml-2 text-sm font-medium">Order detail</span>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
      <Loader2 className="mr-2 size-4 animate-spin" /> Loading orders…
    </div>
  )
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      <span>{message}</span>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function OrdersPage({ detailId }: { detailId?: string }) {
  const [orders, setOrders] = useState<MerchantOrderSummary[]>([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')
  const [listLoading, setListLoading] = useState(!detailId)
  const [detail, setDetail] = useState<MerchantOrder | null>(null)
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [detailLoading, setDetailLoading] = useState(Boolean(detailId))
  const [error, setError] = useState('')
  const [action, setAction] = useState('')

  const loadList = useCallback(async () => {
    setListLoading(true)
    setError('')
    try {
      const page = await merchantJson<MerchantOrderPage>('/orders?limit=100')
      setOrders(page.items)
      setTotal(page.total)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load orders.')
    } finally {
      setListLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    setError('')
    try {
      const [nextOrder, nextAudit] = await Promise.all([
        merchantJson<MerchantOrder>(`/orders/${encodeURIComponent(id)}`),
        merchantJson<AuditPage>(
          `/audit?order_id=${encodeURIComponent(id)}&limit=50`,
        ).catch(() => ({ items: [], total: 0, limit: 50, offset: 0 })),
      ])
      setDetail(nextOrder)
      setAudit(nextAudit.items)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load this order.')
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (detailId) {
      void loadDetail(detailId)
    } else {
      void loadList()
    }
  }, [detailId, loadDetail, loadList])

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: orders.length }
    for (const order of orders) result[order.status] = (result[order.status] ?? 0) + 1
    return result
  }, [orders])

  const visible = useMemo(
    () => (filter === 'all' ? orders : orders.filter((order) => order.status === filter)),
    [orders, filter],
  )

  const runAction = async (name: 'fulfill' | 'cancel' | 'payment-link') => {
    if (!detail || action) return
    setAction(name)
    setError('')
    try {
      const next = await merchantJson<MerchantOrder>(
        `/orders/${encodeURIComponent(detail.id)}/${name}`,
        { method: 'POST' },
      )
      setDetail(next)
      await loadList()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The action could not be completed.')
    } finally {
      setAction('')
    }
  }

  if (detailId) {
    if (detailLoading) {
      return (
        <PageShell onBack={() => (window.location.href = '/orders')}>
          <div className="mx-auto max-w-7xl p-4 md:p-8">
            <Loading />
          </div>
        </PageShell>
      )
    }

    if (!detail) {
      return (
        <PageShell onBack={() => (window.location.href = '/orders')}>
          <div className="mx-auto max-w-7xl p-4 md:p-8">
            <ErrorNotice message={error || 'Order not found.'} onRetry={() => loadDetail(detailId)} />
          </div>
        </PageShell>
      )
    }

    const paid = detail.status === 'paid' || detail.status === 'fulfilled'

    return (
      <PageShell onBack={() => (window.location.href = '/orders')}>
        <main className="mx-auto max-w-7xl p-4 md:p-8">
          <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Order detail
              </p>
              <h1 className="mt-2 font-mono text-2xl font-semibold">{detail.id}</h1>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={detail.status} />
                <span className="text-sm text-muted-foreground">
                  {formatDate(detail.created_at)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {detail.conversation_id && (
                <a href={`/inbox?conversation=${detail.conversation_id}`}>
                  <Button variant="outline" size="sm">
                    View conversation <ChevronRight className="ml-1 size-4" />
                  </Button>
                </a>
              )}
              {detail.approval_link && (
                <a href={detail.approval_link} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Open payment <ExternalLink className="ml-1 size-3.5" />
                  </Button>
                </a>
              )}
              {detail.status === 'confirmed' && (
                <Button size="sm" onClick={() => runAction('payment-link')} disabled={Boolean(action)}>
                  {action === 'payment-link' && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                  Create payment link
                </Button>
              )}
              {detail.status === 'paid' && (
                <Button size="sm" onClick={() => runAction('fulfill')} disabled={Boolean(action)}>
                  {action === 'fulfill' && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                  Mark fulfilled
                </Button>
              )}
              {(detail.status === 'confirmed' || detail.status === 'pending_payment') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runAction('cancel')}
                  disabled={Boolean(action)}
                >
                  {action === 'cancel' && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                  Cancel order
                </Button>
              )}
            </div>
          </div>

          {error && <div className="mt-5"><ErrorNotice message={error} /></div>}

          <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[6px] border border-dashed bg-muted/10">
                <div className="flex justify-between border-b border-dashed px-6 py-4 font-mono text-sm">
                  <span>ORDER</span>
                  <span>{detail.id}</span>
                </div>
                <div className="flex flex-col gap-3 px-6 py-5 font-mono text-sm">
                  {detail.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3">
                      <span>
                        {item.qty} × {item.name_snapshot}
                        {item.variant_snapshot?.name ? ` (${item.variant_snapshot.name})` : ''}
                      </span>
                      <span>{formatMoney(item.line_total, detail.currency)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed px-6 py-4 font-mono text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatMoney(detail.subtotal, detail.currency)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span>{formatMoney(detail.delivery_fee, detail.currency)}</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-dashed pt-3 text-base font-semibold">
                    <span>Total</span>
                    <span>{formatMoney(detail.total, detail.currency)}</span>
                  </div>
                </div>
              </div>

              <section className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Delivery details
                  </p>
                  <p className="text-sm">{deliveryText(detail.delivery_details)}</p>
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Order state
                  </p>
                  <p className="text-sm">
                    Created {formatDate(detail.created_at)}
                    <br />
                    Updated {formatDate(detail.updated_at)}
                  </p>
                </div>
              </section>
            </div>

            <div className="divide-y border-y">
              <section className="py-5">
                <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Payment record
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-xs">
                  <Record label="PayPal order ID" value={detail.paypal_order_id ?? '—'} />
                  <Record
                    label="Status"
                    value={paid ? 'COMPLETED' : detail.status.toUpperCase()}
                  />
                  <Record label="Paid at" value={formatDate(detail.paid_at)} />
                  <Record label="Expires at" value={formatDate(detail.expires_at)} />
                  <Record
                    label="Gross amount"
                    value={formatMoney(detail.total, detail.currency)}
                  />
                  <Record label="Reminders" value={String(detail.reminder_count)} />
                </div>
                {detail.approval_link && (
                  <p className="mt-4 break-all border-l-2 pl-3 font-mono text-[10px] text-muted-foreground">
                    {detail.approval_link}
                  </p>
                )}
              </section>

              <section className="py-5">
                <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Audit log
                </h2>
                {audit.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payment actions recorded yet.</p>
                ) : (
                  <div className="flex flex-col">
                    {audit.map((entry) => (
                      <div
                        key={entry.id}
                        className="border-l border-border pb-4 pl-4 font-mono text-[11px] last:pb-0"
                      >
                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-semibold">{entry.action}</span>
                          <span className="text-muted-foreground">{entry.trigger}</span>
                          {entry.amount && <span>{formatMoney(entry.amount, entry.currency)}</span>}
                          <span className="text-muted-foreground">{entry.result}</span>
                        </div>
                        <p className="mt-1 text-muted-foreground">
                          {formatDate(entry.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Commerce / Orders
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Orders</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Payments, fulfilment, and refunds in one place.
            </p>
            <span className="mt-3 block h-px w-20 bg-[linear-gradient(90deg,var(--primary),transparent)]" />
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {total} order{total === 1 ? '' : 's'} total
            {total > orders.length ? ` · showing latest ${orders.length}` : ''}
          </p>
        </div>

        {error && <div className="mt-5"><ErrorNotice message={error} onRetry={loadList} /></div>}

        <div className="flex gap-1 overflow-x-auto border-b py-4">
          {filters.map(({ value, label }) => (
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
              <span className="ml-1 font-mono opacity-70">{counts[value] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto rounded-[6px] border">
          {listLoading ? (
            <Loading />
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-muted">
                <ShoppingBag className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">No orders here yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Orders your assistant creates in chat will appear in this list.
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                    onClick={() => {
                      window.location.href = `/orders/${order.id}`
                    }}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Package className="size-3.5" /> {order.item_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {formatMoney(order.total, order.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </PageShell>
  )
}

function Record({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 break-words">{value}</p>
    </div>
  )
}
