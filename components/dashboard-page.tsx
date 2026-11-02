'use client'

import { Shell } from '@/components/shell'
import { ArrowUpRight, BarChart3, Inbox, Package, Plus, ShoppingBag, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { products, recentOrders } from '@/lib/mock'

const money = (value: number) => `$${value.toFixed(2)}`
const statusLabel: Record<string, string> = {
  pending_payment: 'Payment pending',
  paid: 'Paid',
  fulfilled: 'Fulfilled',
  confirmed: 'Confirmed',
  draft: 'Draft',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    fulfilled: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    pending_payment: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
    expired: 'bg-muted text-muted-foreground border-border',
    confirmed: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${colors[status] ?? 'bg-muted text-muted-foreground border-border'}`}>
      {statusLabel[status] ?? status}
    </span>
  )
}

export function DashboardPage() {
  const stats = [
    { title: "Today's revenue", value: '$1,284.00', change: '+12.8%', icon: BarChart3 },
    { title: 'Orders today', value: '24', change: '+8.4%', icon: ShoppingBag },
    { title: 'Live chats', value: '12', change: '+3 active', icon: Inbox },
    { title: 'Conversion rate', value: '18.6%', change: '+2.1%', icon: Zap },
  ] as const

  return (
    <Shell>
      <main className="mx-auto max-w-7xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Overview</h1>
          </div>
          <a href="/catalogue">
            <Button className="rounded-full">
              <Plus className="mr-2 size-4" />
              Add product
            </Button>
          </a>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ title, value, change, icon: Icon }) => (
            <Card key={title} className="rounded-[10px]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-4 text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-500">
                  {change} <span className="text-muted-foreground">vs. yesterday</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main content grid */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          {/* Recent orders */}
          <Card className="rounded-[10px]">
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
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <a
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 place-items-center rounded-[6px] bg-muted">
                        <ShoppingBag className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{order.customer}</p>
                        <p className="text-xs text-muted-foreground font-mono">{order.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={order.status} />
                      <span className="hidden text-sm font-medium sm:inline font-mono">{order.amount}</span>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Catalogue at a glance */}
          <Card className="rounded-[10px]">
            <CardHeader>
              <CardTitle className="text-base">Catalogue at a glance</CardTitle>
              <p className="text-sm text-muted-foreground">Products your AI can sell today</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {products.map((product) => (
                <a
                  key={product.id}
                  href="/catalogue"
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="size-11 rounded-[6px] border bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.variants.reduce((sum, v) => sum + v.stock, 0)} in stock
                    </p>
                  </div>
                  <span className="text-sm font-medium font-mono">${product.price.toFixed(2)}</span>
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </Shell>
  )
}
