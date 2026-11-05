'use client'

import { useState } from 'react'
import { Bot, Check, Clipboard, MessageSquare, Package, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import type { Product, StoreSnapshot } from '@/lib/types'

const money = (value: number) => `$${value.toFixed(2)}`
const stockFor = (product: Product) =>
  product.variants.length ? product.variants.reduce((sum, variant) => sum + variant.stock, 0) : 20

export function StorePage({ store }: { store: StoreSnapshot }) {
  const { merchant, products: catalogue, delivery } = store
  const chatHref = `/chat/${merchant.slug}`
  const [copied, setCopied] = useState(false)

  const copyStoreLink = async () => {
    if (typeof window !== 'undefined') {
      await navigator.clipboard?.writeText(window.location.href)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-[6px] bg-primary text-primary-foreground">
              <Sparkles className="size-3.5" strokeWidth={1.5} />
            </div>
            <span className="font-serif text-lg font-semibold lowercase tracking-tight">Plauda</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="/" className="transition-colors hover:text-foreground">
              Home
            </a>
            <a href="#products" className="transition-colors hover:text-foreground">
              Shop
            </a>
            <a href={chatHref} className="transition-colors hover:text-foreground">
              Chat
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <ShieldCheck className="size-3.5" /> Secure checkout
            </span>
            <a href={chatHref} className={buttonVariants({ size: 'default', className: 'h-9 rounded-full px-4 shadow-sm' })}>
              <MessageSquare className="mr-1.5 size-4" /> Chat with AI
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border/60 bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid size-14 place-items-center rounded-[12px] bg-primary text-primary-foreground">
                  <Sparkles className="size-6" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Storefront</p>
                  <h1 className="mt-1 font-serif text-3xl tracking-tight sm:text-4xl">{merchant.name}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{merchant.tagline}</p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <a
                      href={chatHref}
                      className={buttonVariants({
                        size: 'lg',
                        className: 'h-10 w-full rounded-full px-5 text-sm shadow-sm sm:w-auto',
                      })}
                    >
                      <MessageSquare className="mr-2 size-4" /> Chat with the AI assistant
                    </a>
                    <p className="text-xs text-muted-foreground">
                      Ask about products, delivery, or an order.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5 text-[11px] text-muted-foreground">
                  <Truck className="size-3.5" /> {delivery.label} · {delivery.eta}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-[#3F6B4F]">
                  <span className="size-1.5 rounded-full bg-emerald-500" /> AI assistant online
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="products" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-10 sm:px-6 lg:py-12">
          <div>
            <div className="flex items-end justify-between border-b border-border/60 pb-4">
              <div>
                <h2 className="font-serif text-2xl tracking-tight">Shop the collection</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {catalogue.length} products · prices in USD
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {catalogue.map((product) => {
                const stock = stockFor(product)
                return (
                  <article
                    key={product.id}
                    className="rounded-[12px] border border-border/60 bg-card p-3 transition-colors hover:border-border"
                  >
                    <div className="grid aspect-[4/3] place-items-center rounded-[8px] border border-border/40 bg-gradient-to-br from-secondary to-accent">
                      <div className="grid size-16 place-items-center rounded-full bg-background/50">
                        <Package className="size-6 text-muted-foreground/50" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-medium">{product.name}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{product.description}</p>
                      </div>
                      <span className="shrink-0 font-mono text-sm">{money(product.price)}</span>
                    </div>
                    <div className="mt-3 flex items-center border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                      <span className="truncate">
                        {product.variants.length
                          ? `${product.variants.map((variant) => variant.name).join(' · ')} · ${stock} in stock`
                          : `${stock} in stock`}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Bot, title: 'Ask anything', desc: 'Chat about products, delivery, or an existing order.' },
                { icon: Truck, title: 'Clear delivery', desc: 'Standard delivery takes 3–5 business days.' },
                { icon: ShieldCheck, title: 'Secure checkout', desc: 'Review and pay on a separate secure page.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-[10px] border border-border/60 bg-card p-4">
                  <Icon className="size-4 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {merchant.name}. All rights reserved.
          </p>
          <p>
            Storefront powered by{' '}
            <a href="/" className="text-foreground underline underline-offset-4">
              Plauda
            </a>
            <span className="mx-1.5">·</span>
            <a href="/login" className="transition-colors hover:text-foreground">
              Merchant sign in
            </a>
          </p>
          <button onClick={copyStoreLink} className="hidden items-center gap-1 hover:text-foreground sm:flex">
            {copied ? <Check className="size-3 text-emerald-600" /> : <Clipboard className="size-3" />}
            {copied ? 'Link copied' : 'Copy store link'}
          </button>
        </div>
      </footer>
    </div>
  )
}
