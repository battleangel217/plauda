'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Lock, Package, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { payOrder } from '@/lib/api'
import type { CheckoutCustomer, Merchant, Order } from '@/lib/types'

const money = (value: number) => `$${value.toFixed(2)}`

interface CheckoutPageProps {
  order: Order
  merchant: Merchant
  customer: CheckoutCustomer
}

export function CheckoutPage({ order, merchant, customer }: CheckoutPageProps) {
  const [paid, setPaid] = useState(order.status === 'paid')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const storeHref = `/store/${merchant.slug}`
  const orderKey = `plauda-order:${order.id}`

  useEffect(() => {
    try {
      if (order.status === 'paid' || window.localStorage.getItem(orderKey) === 'paid') {
        setPaid(true)
      }
    } catch {
      // Storage may be unavailable; the server-rendered status is still used.
    }
  }, [order.status, orderKey])

  const markPaid = () => {
    setPaid(true)

    try {
      window.localStorage.setItem(orderKey, 'paid')

      const chatKey = `plauda-chat:${merchant.slug}`
      const raw = window.localStorage.getItem(chatKey)
      if (raw) {
        const saved = JSON.parse(raw) as { order?: Order }
        if (saved.order) {
          window.localStorage.setItem(
            chatKey,
            JSON.stringify({ ...saved, order: { ...saved.order, status: 'paid' } }),
          )
        }
      }
    } catch {
      // Persistence is a convenience; payment confirmation still shows.
    }
  }

  const pay = async () => {
    setProcessing(true)
    setError(null)

    try {
      const result = await payOrder(order.id)

      if (result.payment.approvalUrl) {
        window.location.assign(result.payment.approvalUrl)
        return
      }

      if (result.payment.status === 'paid') {
        markPaid()
      } else {
        setError('Payment is pending confirmation. Please refresh in a moment.')
      }
    } catch {
      setError('Payment could not be completed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <a href={storeHref} className="flex items-center gap-2">
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

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <a
          href={storeHref}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to {merchant.name}
        </a>

        {paid ? (
          <div className="mx-auto mt-10 max-w-lg text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/10 text-[#3F6B4F]">
              <Check className="size-7" />
            </div>
            <h1 className="mt-6 font-serif text-3xl tracking-tight">Payment confirmed</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Order <span className="font-mono text-foreground">{order.id}</span> has been paid. A
              receipt has been sent to {customer.email}.
            </p>
            <Card className="mt-8 rounded-[10px] text-left">
              <CardContent className="space-y-3 p-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total paid</span>
                  <span className="font-mono font-semibold">{money(order.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{order.deliveryDetails}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping to</span>
                  <span className="max-w-[60%] text-right">{customer.address}</span>
                </div>
              </CardContent>
            </Card>
            <a
              href={storeHref}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Back to store
            </a>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Checkout</p>
              <h1 className="mt-1 font-serif text-3xl tracking-tight sm:text-4xl">Review your order</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Order <span className="font-mono text-foreground">{order.id}</span> with {merchant.name}.
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
                      <div key={`${item.nameSnapshot}-${index}`} className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="grid size-11 place-items-center rounded-[8px] border border-border/50 bg-gradient-to-br from-secondary to-accent">
                            <Package className="size-4 text-muted-foreground/60" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.nameSnapshot}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.variantSnapshot} · Qty {item.qty}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-sm">{money(item.unitPrice * item.qty)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[10px] border border-border/60 bg-card p-5">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      <Truck className="size-3.5" /> Delivery
                    </p>
                    <p className="mt-3 text-sm">{order.deliveryDetails}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{customer.address}</p>
                  </div>
                  <div className="rounded-[10px] border border-border/60 bg-card p-5">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      <ShieldCheck className="size-3.5" /> Contact
                    </p>
                    <p className="mt-3 text-sm">{customer.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
              </div>

              <aside>
                <Card className="rounded-[10px] lg:sticky lg:top-6">
                  <CardHeader className="px-5 py-4">
                    <CardTitle className="text-base">Order summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-5 pb-5 pt-0 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-mono">{money(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery</span>
                      <span className="font-mono">{money(order.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3 text-base font-semibold">
                      <span>Total</span>
                      <span className="font-mono">{money(order.total)}</span>
                    </div>
                    <Button
                      className="mt-2 h-11 w-full rounded-[6px]"
                      onClick={pay}
                      disabled={processing}
                    >
                      {processing ? 'Processing payment…' : `Pay ${money(order.total)} with PayPal`}
                    </Button>
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
