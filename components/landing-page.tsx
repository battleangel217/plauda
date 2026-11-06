'use client'

import { useState, useEffect } from 'react'
import { ArrowUpRight, Bot, Check, CreditCard, Languages, LayoutDashboard, MessageSquare, Package, ShoppingBag, Sparkles, Store, X, Menu } from 'lucide-react'
import { BRAND_NAME } from '@/lib/brand'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > threshold)
    window.addEventListener('scroll', handle, { passive: true })
    return () => window.removeEventListener('scroll', handle)
  }, [threshold])
  return scrolled
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  const scrolled = useScrolled()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-background/90 backdrop-blur-md border-b border-border/50' : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-6">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="grid size-8 place-items-center rounded-[8px] bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
              <Sparkles className="size-4" strokeWidth={1.5} />
            </div>
            <span className="font-serif text-[17px] font-semibold lowercase tracking-tight">
              {BRAND_NAME}
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
            {['Problem', 'Features', 'How It Works', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-[13.5px] text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-full px-4 h-9 text-[13.5px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              Log in
            </a>
            <a
              href="/register"
              className="inline-flex items-center justify-center rounded-full px-5 h-9 border border-border/50 bg-foreground text-background text-[13.5px] font-medium hover:opacity-90 transition-all"
            >
              Start Free Trial
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>
        </nav>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-[100] bg-background flex flex-col transition-all duration-300 md:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-6 h-[68px] border-b border-border/50 flex-shrink-0">
          <a href="/" className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-[8px] bg-primary text-primary-foreground">
              <Sparkles className="size-4" strokeWidth={1.5} />
            </div>
            <span className="font-serif text-[17px] font-semibold lowercase tracking-tight">{BRAND_NAME}</span>
          </a>
          <button
            className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col justify-between px-6 py-10">
          <nav className="flex flex-col gap-1">
            {['Problem', 'Features', 'How It Works', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-2xl font-medium text-muted-foreground hover:text-foreground py-3 border-b border-border/50 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-3 pt-8">
            <a href="/register" className="flex items-center justify-center w-full h-13 rounded-2xl bg-foreground text-background font-bold text-base hover:opacity-90 transition-all">
              Start Free Trial
            </a>
            <a href="/login" className="flex items-center justify-center w-full h-13 rounded-2xl border border-border text-foreground hover:bg-muted/50 font-medium text-base transition-all">
              Log in
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

const previewProducts = [
  { name: 'Everyday Tote', detail: 'Natural canvas', price: '$38' },
  { name: 'Ceramic Mug', detail: 'Sand · 12 oz', price: '$28' },
]

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[920px] px-6 pb-16">
      <div className="pointer-events-none absolute inset-x-24 top-16 z-0 h-64 rounded-[32px] bg-primary/10 blur-3xl" />
      <div className="relative z-10 overflow-hidden rounded-[16px] border border-border/70 bg-card text-left">
        {/* Browser bar */}
        <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/30 px-4 py-3">
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
          <div className="mx-auto flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1">
            <Store className="size-3 text-muted-foreground" />
            <span className="font-mono text-[10px] text-muted-foreground">luma-goods.plauda.app</span>
          </div>
          <span className="w-8" aria-hidden="true" />
        </div>

        <div className="grid md:grid-cols-[1.02fr_0.98fr]">
          {/* Storefront pane */}
          <div className="border-b border-border/60 p-5 sm:p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-[8px] bg-primary text-primary-foreground">
                <Sparkles className="size-4" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Luma Goods</p>
                <p className="text-[11px] text-muted-foreground">Everyday objects, made well</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {previewProducts.map((product) => (
                <div key={product.name} className="rounded-[10px] border border-border/60 bg-background p-2.5">
                  <div className="mb-2.5 grid aspect-[4/3] place-items-center rounded-[7px] border border-border/40 bg-gradient-to-br from-secondary to-accent">
                    <div className="size-9 rounded-full bg-background/50" />
                  </div>
                  <p className="text-[12px] font-medium leading-tight">{product.name}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{product.detail}</p>
                  <p className="mt-1.5 font-mono text-[11px]">{product.price}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-[8px] border border-border/60 bg-muted/30 px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Package className="size-3" /> Standard delivery · 3–5 days
              </span>
              <span className="text-[10px] font-medium text-primary">Store link</span>
            </div>
          </div>

          {/* Chat pane */}
          <div className="flex flex-col bg-background p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="size-3.5" />
                </div>
                <div>
                  <p className="text-[12px] font-medium leading-tight">Luma assistant</p>
                  <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-emerald-500" /> Online now
                  </p>
                </div>
              </div>
              <Sparkles className="size-3.5 text-muted-foreground/50" />
            </div>

            <div className="flex flex-1 flex-col gap-2.5 py-4">
              <div className="max-w-[85%] rounded-[10px] rounded-bl-sm border border-border/60 bg-card px-3 py-2 text-[11px] leading-relaxed">
                Hi! Looking for something in particular?
              </div>
              <div className="ml-auto max-w-[80%] rounded-[10px] rounded-br-sm bg-primary px-3 py-2 text-[11px] leading-relaxed text-primary-foreground">
                A gift under $50 — maybe a mug?
              </div>
              <div className="max-w-[90%] rounded-[10px] rounded-bl-sm border border-border/60 bg-card px-3 py-2 text-[11px] leading-relaxed">
                The Ceramic Travel Mug is $28 and in stock in Sand. I can add it to your order.
              </div>
            </div>

            <div className="rounded-[10px] border border-border/60 bg-card p-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium">Ceramic Travel Mug</span>
                <span className="font-mono">$28.00</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Sand · Qty 1</span>
                <span>+ $6 delivery</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
                <span className="text-[11px] font-semibold">Total</span>
                <span className="font-mono text-[12px] font-semibold">$34.00</span>
              </div>
              <div className="mt-2 flex h-8 items-center justify-center gap-1.5 rounded-[6px] bg-foreground text-[11px] font-medium text-background">
                Review &amp; pay <ArrowUpRight className="size-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <div className="relative z-10 flex flex-col items-center text-center gap-6 pt-32 pb-10 px-6 sm:pt-36">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-primary uppercase tracking-widest">
          <span className="w-5 h-px bg-primary" />
          AI Sales Assistant for Your Store
        </div>
        <h1 className="font-serif font-medium text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.08] max-w-2xl">
          <span className="text-foreground block">Your business deserves</span>
          <span className="text-muted-foreground/40 block">an AI employee.</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg">
          {BRAND_NAME} gives your business a shareable storefront and an AI chat assistant that
          answers questions, recommends products, and takes orders — 24/7.
        </p>
        <div className="flex flex-row items-center justify-center gap-3 flex-wrap pt-1">
          <a
            href="/register"
            className="inline-flex items-center justify-center h-11 px-8 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Start Free Trial
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center h-11 px-8 rounded-full border border-border text-foreground bg-transparent hover:bg-muted/50 font-medium text-sm transition-all"
          >
            See how it works
          </a>
        </div>
      </div>

      <div className="relative z-0 mt-12">
        <HeroPreview />
      </div>
    </section>
  )
}

// ─── Problem ──────────────────────────────────────────────────────────────────

function Problem() {
  const stats = [
    { value: '96.5%', desc: 'of consumers consider fast customer response critical to making a purchase.', source: 'Customer Experience Survey' },
    { value: '7 in 10', desc: 'buyers expect a helpful answer within sixty minutes of reaching out.', source: '2025 Consumer Study' },
    { value: '54%', desc: 'of small businesses rely directly on digital channels for daily sales.', source: 'PwC MSME Survey 2024' },
  ]
  return (
    <section id="problem" className="py-24 sm:py-32 px-6 border-t border-border/50">
      <div className="max-w-[1240px] mx-auto space-y-16">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-primary uppercase tracking-widest">
            <span className="w-5 h-px bg-primary" />
            The Challenge
          </div>
          <h2 className="font-serif font-medium text-4xl sm:text-6xl tracking-tight leading-[1.1]">
            <span className="text-foreground block">The problem isn't finding customers.</span>
            <span className="text-muted-foreground/40 block">It's being available when they reach out.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6 lg:pr-8">
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Businesses lose sales and waste hours because they can't respond to every customer,
              answer repetitive questions, recommend products, and process orders quickly and consistently.
            </p>
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <p className="text-foreground text-base sm:text-lg leading-relaxed font-medium">
                "When a buyer messages late at night to order or ask questions, waiting until morning often means losing that sale."
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {stats.map(({ value, desc, source }) => (
              <div key={value} className="rounded-2xl border border-border/50 bg-card p-6 flex items-start gap-5 hover:border-border transition-all duration-300">
                <div className="flex-shrink-0">
                  <span className="font-serif font-medium text-3xl sm:text-4xl text-foreground tracking-tight leading-none">{value}</span>
                </div>
                <div className="space-y-1 pt-1">
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  <p className="text-[11px] font-medium text-muted-foreground/50">{source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

const features = [
  { icon: Bot, title: 'AI Store Assistant', desc: 'Chats naturally with customers using your verified products, prices, and policies.' },
  { icon: Store, title: 'Shareable Storefront', desc: 'One link for your catalogue, delivery info, and AI assistant — ready to share anywhere.' },
  { icon: MessageSquare, title: 'Customer Support', desc: 'Answers product, delivery, and policy questions instantly, day or night.' },
  { icon: Sparkles, title: 'Product Recommendations', desc: 'Understands buyer preferences and recommends suitable items within their budget.' },
  { icon: ShoppingBag, title: 'Order Processing', desc: 'Collects item choices, variants, and delivery details into structured orders.' },
  { icon: CreditCard, title: 'Secure Checkout', desc: 'Customers review and pay on a dedicated checkout page — never inside the chat.' },
  { icon: Languages, title: 'Multilingual Chat', desc: 'Communicates fluently across multiple languages and dialects.' },
  { icon: LayoutDashboard, title: 'Operations Workspace', desc: 'Track live conversations, confirmed orders, and revenue from one unified dashboard.' },
]

function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 px-6 relative border-t border-border/50">
      <div className="max-w-[1240px] mx-auto space-y-16">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-primary uppercase tracking-widest">
            <span className="w-5 h-px bg-primary" />
            Capabilities
          </div>
          <h2 className="font-serif font-medium text-4xl sm:text-6xl tracking-tight leading-[1.1]">
            <span className="text-foreground block">Built to execute real business tasks.</span>
            <span className="text-muted-foreground/40 block">Grounded in your actual catalogue.</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-lg mx-auto">
            Not a generic chatbot. {BRAND_NAME} works strictly from your approved products, prices, and policies.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* Features grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-border/50 bg-card p-6 flex flex-col gap-4 hover:border-border transition-all duration-300"
              >
                <div className="w-9 h-9 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground">
                  <Icon className="size-[17px]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-sans font-medium text-[16px] text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary card */}
          <div className="rounded-2xl border border-border/50 bg-card p-8 flex flex-col justify-between hover:border-border transition-all duration-300">
            <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest">All-in-one</span>
            <div className="space-y-5 pt-8">
              <div className="space-y-2">
                <h3 className="font-serif font-medium text-2xl text-foreground tracking-tight leading-snug">
                  Always available. Always accurate.
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Configure your business once. Your AI employee works 24/7 without missing an order,
                  providing wrong prices, or leaving a buyer waiting.
                </p>
              </div>
              <a
                href="/register"
                className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowUpRight className="size-[15px]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      step: 1,
      title: 'Add your products and policies',
      desc: `Input your catalogue, prices, delivery zones, and FAQs. ${BRAND_NAME} learns your exact inventory and never invents unapproved details.`,
      offset: false,
    },
    {
      step: 2,
      title: 'Share your store link',
      desc: `One link for your social media bio, WhatsApp, or website. Customers browse your store and chat with your AI assistant immediately.`,
      offset: true,
    },
    {
      step: 3,
      title: 'Customer checks out securely',
      desc: `The AI prepares the order. The customer reviews and pays on a separate checkout page, and the sale lands in your dashboard when payment arrives.`,
      offset: false,
    },
  ]

  return (
    <section id="how-it-works" className="py-24 sm:py-32 px-6 relative border-t border-border/50">
      <div className="max-w-[1240px] mx-auto space-y-16">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-primary uppercase tracking-widest">
            <span className="w-5 h-px bg-primary" />
            How it works
          </div>
          <h2 className="font-serif font-medium text-4xl sm:text-6xl tracking-tight leading-[1.1]">
            <span className="text-foreground block">Simple to launch.</span>
            <span className="text-muted-foreground/40 block">Effortless to run.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pb-16">
          {steps.map(({ step, title, desc, offset }) => (
            <div
              key={step}
              className={`rounded-2xl border border-border/50 bg-card p-7 flex flex-col gap-10 hover:border-border transition-all duration-300 ${
                offset ? 'md:translate-y-10' : ''
              }`}
            >
              <span className="text-xs font-semibold text-primary tracking-wide uppercase">Step {step}</span>
              <div className="space-y-2.5">
                <h3 className="font-sans font-medium text-[18px] text-foreground leading-snug">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const plans = [
  {
    name: 'Starter',
    price: 0,
    period: 'Free forever',
    desc: 'Perfect for trying out your AI employee.',
    features: [
      '1 product catalogue',
      'Up to 100 AI conversations/month',
      'Basic order processing',
      'Plauda store link',
    ],
    cta: 'Get started free',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: 29,
    period: 'per month',
    desc: 'For businesses ready to scale their AI workforce.',
    features: [
      'Unlimited products',
      'Unlimited AI conversations',
      'Order processing & checkout',
      'Live inbox & handoff',
      'Business info & FAQs',
      'Email support',
    ],
    cta: 'Start free trial',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: 79,
    period: 'per month',
    desc: 'For high-volume stores with advanced needs.',
    features: [
      'Everything in Growth',
      'Custom domain',
      'Multilingual chat support',
      'Team members & roles',
      'Advanced analytics',
      'Priority support',
    ],
    cta: 'Start free trial',
    href: '/register',
    highlighted: false,
  },
]

function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" className="py-24 sm:py-32 px-6 relative border-t border-border/50">
      <div className="max-w-[1240px] mx-auto space-y-16">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-primary uppercase tracking-widest">
            <span className="w-5 h-px bg-primary" />
            Pricing
          </div>
          <h2 className="font-serif font-medium text-4xl sm:text-6xl tracking-tight leading-[1.1]">
            <span className="text-foreground block">Transparent plans.</span>
            <span className="text-muted-foreground/40 block">No surprises.</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-lg mx-auto">
            Start free and scale as your business grows.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 rounded-full border border-border/50 bg-card px-4 py-2 text-sm">
            <span className={annual ? 'text-muted-foreground' : 'font-medium text-foreground'}>Monthly</span>
            <button
              role="switch"
              aria-checked={annual}
              onClick={() => setAnnual(!annual)}
              className={`relative h-5 w-10 rounded-full border transition-colors ${annual ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
            >
              <span
                className={`absolute top-0.5 size-3.5 rounded-full bg-background transition-transform ${annual ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
            <span className={annual ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              Annual <span className="text-primary text-[10px] font-semibold ml-1">–20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(({ name, price, period, desc, features, cta, href, highlighted }) => {
            const displayPrice = annual && price > 0 ? Math.round(price * 0.8) : price
            return (
              <div
                key={name}
                className={`rounded-2xl border p-8 flex flex-col gap-6 transition-all duration-300 ${
                  highlighted
                    ? 'border-primary/50 bg-primary/5 relative overflow-hidden'
                    : 'border-border/50 bg-card hover:border-border'
                }`}
              >
                {highlighted && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                )}
                <div>
                  {highlighted && (
                    <span className="inline-block rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-semibold text-primary uppercase tracking-wide mb-3">
                      Most popular
                    </span>
                  )}
                  <h3 className="font-sans font-semibold text-xl text-foreground">{name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-medium text-foreground">
                      {price === 0 ? 'Free' : `$${displayPrice}`}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground">{annual ? '/mo, billed annually' : '/mo'}</span>
                    )}
                  </div>
                  {price === 0 && <span className="text-sm text-muted-foreground">{period}</span>}
                </div>
                <ul className="space-y-3 flex-1">
                  {features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <Check className="size-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={href}
                  className={`flex items-center justify-center w-full h-11 rounded-xl text-sm font-medium transition-all ${
                    highlighted
                      ? 'bg-foreground text-background hover:opacity-90'
                      : 'border border-border text-foreground hover:bg-muted/50'
                  }`}
                >
                  {cta}
                  <ArrowUpRight className="ml-1.5 size-4" />
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-24 sm:py-32 px-6 border-t border-border/50">
      <div className="max-w-[1240px] mx-auto text-center space-y-8">
        <h2 className="font-serif font-medium text-4xl sm:text-6xl tracking-tight leading-[1.1]">
          <span className="text-foreground block">Your shop, answering</span>
          <span className="text-muted-foreground/40 block">customers at 3am.</span>
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md mx-auto">
          Set up your storefront and AI assistant in minutes. Turn conversations into paid orders.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/register"
            className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Start Free Trial
            <ArrowUpRight className="ml-2 size-4" />
          </a>
          <a
            href="/login"
            className="inline-flex items-center justify-center h-12 px-8 rounded-full border border-border text-foreground hover:bg-muted/50 font-medium text-sm transition-all"
          >
            Sign in
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border/50 px-6 py-10">
      <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <a href="/" className="flex items-center gap-2 group">
          <div className="grid size-6 place-items-center rounded-[6px] bg-primary text-primary-foreground">
            <Sparkles className="size-3" strokeWidth={1.5} />
          </div>
          <span className="font-serif text-base font-semibold lowercase tracking-tight">{BRAND_NAME}</span>
        </a>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
        </p>
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="/login" className="hover:text-foreground transition-colors">Sign in</a>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="bg-background text-foreground min-h-screen overflow-x-hidden">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Features />
        <HowItWorks />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
