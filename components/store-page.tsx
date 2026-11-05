'use client'

import { useState } from 'react'
import {
  Bot,
  Check,
  Clipboard,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import type { PublicStoreMeta } from '@/lib/backend-types'

export function StorePage({ store }: { store: PublicStoreMeta }) {
  const chatHref = `/chat/${store.slug}`
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
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href={chatHref} className="transition-colors hover:text-foreground">
              Chat
            </a>
            <a href="/login" className="transition-colors hover:text-foreground">
              Merchant sign in
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <ShieldCheck className="size-3.5" /> Secure checkout
            </span>
            <a
              href={chatHref}
              className={buttonVariants({
                size: 'default',
                className: 'h-9 rounded-full px-4 shadow-sm',
              })}
            >
              <MessageSquare className="mr-1.5 size-4" /> Chat with AI
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border/60 bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-[14px] bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="size-7" strokeWidth={1.5} />
              </div>
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-widest text-primary">
                Storefront
              </p>
              <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">{store.name}</h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Ask the AI assistant about products, delivery, or an order. It can put your order
                together and share a secure payment link when the store has payments enabled.
              </p>

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href={chatHref}
                  className={buttonVariants({
                    size: 'lg',
                    className: 'h-12 w-full rounded-full px-7 text-sm shadow-sm sm:w-auto',
                  })}
                >
                  <MessageSquare className="mr-2 size-4" /> Chat with the AI assistant
                </a>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-[#3F6B4F]">
                  <span className="size-1.5 rounded-full bg-emerald-500" /> AI assistant online
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                The assistant quotes prices in {store.currency}. No account is needed to chat.
              </p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6 lg:py-16">
          <div className="text-center">
            <h2 className="font-serif text-2xl tracking-tight sm:text-3xl">How it works</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Your whole shopping experience happens in one conversation.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Bot,
                step: '01',
                title: 'Ask about anything',
                desc: 'Products, prices, stock, delivery options, or an existing order. The assistant answers from the store’s own information.',
              },
              {
                icon: Truck,
                step: '02',
                title: 'Build your order',
                desc: 'Pick your items and delivery details in chat. The assistant confirms the order and the final total before payment.',
              },
              {
                icon: CreditCard,
                step: '03',
                title: 'Pay securely',
                desc: 'Review the order on a separate checkout page, then pay with PayPal. Plauda never sees your card details.',
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="rounded-[12px] border border-border/60 bg-card p-5">
                <div className="flex items-center justify-between">
                  <div className="grid size-9 place-items-center rounded-full bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">{step}</span>
                </div>
                <p className="mt-4 text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[12px] border border-border/60 bg-muted/30 px-5 py-5 sm:flex-row">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Ready when you are</p>
                <p className="text-xs text-muted-foreground">
                  Start a conversation and the assistant will take it from there.
                </p>
              </div>
            </div>
            <a
              href={chatHref}
              className={buttonVariants({
                className: 'h-10 w-full rounded-full px-5 sm:w-auto',
              })}
            >
              Open chat <MessageSquare className="ml-2 size-4" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {store.name}. All rights reserved.
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
          <button onClick={copyStoreLink} className="flex items-center gap-1 hover:text-foreground">
            {copied ? <Check className="size-3 text-emerald-600" /> : <Clipboard className="size-3" />}
            {copied ? 'Link copied' : 'Copy store link'}
          </button>
        </div>
      </footer>
    </div>
  )
}
