'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Bot,
  ChevronRight,
  Clipboard,
  Copy,
  Check,
  Inbox,
  LayoutDashboard,
  Menu,
  Moon,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Sun,
  UserRound,
  X,
  Zap,
} from 'lucide-react'
import { BRAND_NAME, chatUrl } from '@/lib/brand'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Inbox', href: '/inbox', icon: Inbox, badge: 3 },
  { label: 'Orders', href: '/orders', icon: ShoppingBag },
  { label: 'Catalogue', href: '/catalogue', icon: Package },
  { label: 'Business Info', href: '/business-info', icon: Bot },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const

function Logo() {
  return (
    <a href="/" className="flex items-center gap-2 group">
      <div className="grid size-7 place-items-center rounded-[6px] bg-primary text-primary-foreground group-hover:opacity-90 transition-opacity">
        <Sparkles className="size-3.5" strokeWidth={1.5} />
      </div>
      <span className="font-serif text-xl font-semibold lowercase tracking-tight">{BRAND_NAME}</span>
    </a>
  )
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [dark, setDark] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [copied, setCopied] = useState(false)

  // Sync dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Close mobile nav on route change
  useEffect(() => {
    setMobile(false)
  }, [pathname])

  const chatPath = '/chat/luma-goods'
  const [chatLink, setChatLink] = useState(chatPath)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setChatLink(`${window.location.origin}${chatPath}`)
    }
  }, [])
  const copyLink = async () => {
    const full = typeof window !== 'undefined' ? `${window.location.origin}${chatPath}` : chatLink
    await navigator.clipboard?.writeText(full)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobile && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobile(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-background p-4 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2 py-1">
          <Logo />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobile(false)}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav className="mt-8 flex flex-col gap-0.5" aria-label="Main navigation">
          {NAV_ITEMS.map(({ label, href, icon: Icon, badge }) => {
            const active = isActive(href)
            return (
              <a
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-[6px] border-l-2 px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'border-primary font-medium text-foreground bg-muted/50'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="size-4 flex-shrink-0" />
                {label}
                {badge && (
                  <Badge className="ml-auto rounded-full px-1.5 text-[10px] leading-none py-0.5">
                    {badge}
                  </Badge>
                )}
              </a>
            )
          })}
        </nav>

        {/* AI Status card */}
        <div className="mt-auto rounded-[6px] border border-border bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <p className="text-xs font-medium">Your AI employee is live</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ready to handle customers 24/7.
          </p>
          <a
            href={chatPath}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline font-mono truncate"
            suppressHydrationWarning
          >
            {chatLink}
            <ChevronRight className="size-3 flex-shrink-0" />
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobile(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
            <div className="hidden items-center gap-2 text-sm font-medium lg:flex">
              Good morning, Alex
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-xs">Luma Goods</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden rounded-full sm:flex"
              onClick={copyLink}
              aria-label="Copy chat link"
            >
              {copied ? (
                <Check className="mr-2 size-3.5 text-emerald-600" />
              ) : (
                <Clipboard className="mr-2 size-3.5" />
              )}
              {copied ? 'Copied!' : 'Copy chat link'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark(!dark)}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Profile">
              <UserRound className="size-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        {children}
      </div>
    </div>
  )
}
