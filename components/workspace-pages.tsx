'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  Save,
  Settings2,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getStoredUser } from '@/lib/auth-client'
import { merchantJson } from '@/lib/merchant-client'
import type {
  AuthUser,
  BusinessInfoDoc,
  DeliveryZone,
  MerchantSettings,
  PayPalStatus,
} from '@/lib/backend-types'

const sources = [
  { key: 'about', label: 'About', hint: 'Who you are, what you sell, and how you talk about it.' },
  { key: 'policies', label: 'Policies', hint: 'Returns, warranties, shipping rules, and other promises.' },
  { key: 'faq', label: 'FAQ', hint: 'Answers to the questions customers ask most often.' },
] as const

type Source = (typeof sources)[number]['key']

function Preview({ value }: { value: string }) {
  return (
    <div className="prose prose-sm min-h-[280px] max-w-none whitespace-pre-wrap p-4 text-sm leading-7 text-foreground">
      {value.split('\n').map((line, index) => (
        <p
          key={`${line}-${index}`}
          className={line.startsWith('#') ? 'font-semibold' : line.startsWith('-') ? 'pl-3' : ''}
        >
          {line.replace(/^#+\s/, '').replace(/^[-]\s/, '• ') || '\u00a0'}
        </p>
      ))}
    </div>
  )
}

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback
}

export function BusinessInfoPage() {
  const [tab, setTab] = useState<Source>('about')
  const [docs, setDocs] = useState<Record<Source, string>>({ about: '', policies: '', faq: '' })
  const [updated, setUpdated] = useState<Record<Source, string | null>>({
    about: null,
    policies: null,
    faq: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const items = await merchantJson<BusinessInfoDoc[]>('/business-info')
      const content: Record<Source, string> = { about: '', policies: '', faq: '' }
      const timestamps: Record<Source, string | null> = { about: null, policies: null, faq: null }
      for (const item of items) {
        if (item.source === 'about' || item.source === 'policies' || item.source === 'faq') {
          content[item.source] = item.content
          timestamps[item.source] = item.updated_at
        }
      }
      setDocs(content)
      setUpdated(timestamps)
    } catch (caught) {
      setError(errorMessage(caught, 'Could not load your business info.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    if (saving) return
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const saved = await merchantJson<BusinessInfoDoc>(`/business-info/${tab}`, {
        method: 'PUT',
        body: JSON.stringify({ content: docs[tab] }),
      })
      setUpdated((current) => ({ ...current, [tab]: saved.updated_at }))
      setMessage('Saved')
      setTimeout(() => setMessage(''), 2000)
    } catch (caught) {
      setError(errorMessage(caught, 'Could not save this document.'))
    } finally {
      setSaving(false)
    }
  }

  const active = sources.find((source) => source.key === tab)!

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Knowledge
        </p>
        <h1 className="mt-1 text-3xl">Business info</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Everything here becomes source material for your assistant. Write it the way you would
          explain it to a new customer.
        </p>
        <span className="mt-3 block h-px w-20 bg-[linear-gradient(90deg,var(--primary),transparent)]" />
      </div>

      {error && (
        <div className="mb-5 rounded-[8px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden rounded-[10px]">
          <div className="flex items-center gap-5 border-b px-4 pt-4 text-sm">
            {sources.map((source) => (
              <button
                key={source.key}
                onClick={() => {
                  setTab(source.key)
                  setMessage('')
                  setError('')
                }}
                className={`border-b-2 pb-3 ${
                  tab === source.key
                    ? 'border-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {source.label}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2">
            <div className="border-b p-4 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{active.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{active.hint}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {updated[tab] ? `Updated ${new Date(updated[tab]!).toLocaleDateString()}` : 'Not saved yet'}
                </span>
              </div>
              {loading ? (
                <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
                </div>
              ) : (
                <Textarea
                  value={docs[tab]}
                  onChange={(event) =>
                    setDocs((current) => ({ ...current, [tab]: event.target.value }))
                  }
                  placeholder={`Write your ${active.label.toLowerCase()} information in markdown…`}
                  className="min-h-[320px] resize-y font-mono text-sm"
                />
              )}
            </div>
            <div>
              <p className="border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Preview
              </p>
              <Preview value={docs[tab]} />
            </div>
          </div>

          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {message || (saving ? 'Saving…' : 'Changes are used by the assistant after saving.')}
            </p>
            <Button onClick={() => void save()} disabled={saving || loading}>
              {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />}
              Save {active.label.toLowerCase()}
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[10px]">
            <CardHeader>
              <CardTitle className="text-base">How this is used</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Your assistant searches these notes before answering questions about the business.
                Keep facts current and specific.
              </p>
              <div className="flex items-start gap-2 rounded-[6px] border bg-muted/20 p-3 text-xs">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <span>Only published information is shared with customers.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[10px]">
            <CardHeader>
              <CardTitle className="text-base">A good place to start</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>• What makes your products different?</p>
              <p>• How long does delivery usually take?</p>
              <p>• What can a customer return, and when?</p>
              <p>• Which questions do you answer every day?</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await navigator.clipboard?.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      }}
    >
      {copied ? <Check className="mr-1.5 size-4" /> : <Copy className="mr-1.5 size-4" />}
      {copied ? 'Copied' : label}
    </Button>
  )
}

function PayPalForm({ onConnected }: { onConnected: (status: PayPalStatus) => void }) {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [webhookId, setWebhookId] = useState('')
  const [env, setEnv] = useState<'sandbox' | 'live'>('sandbox')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const connect = async () => {
    if (!clientId.trim() || !clientSecret.trim() || !webhookId.trim()) {
      setError('Client ID, secret, and webhook ID are required.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const status = await merchantJson<PayPalStatus>('/settings/paypal', {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId.trim(),
          client_secret: clientSecret.trim(),
          webhook_id: webhookId.trim(),
          env,
        }),
      })
      onConnected(status)
    } catch (caught) {
      setError(errorMessage(caught, 'PayPal rejected these credentials.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-[6px] border bg-muted/20 p-4">
      <label className="block text-xs">
        Client ID
        <Input value={clientId} onChange={(event) => setClientId(event.target.value)} className="mt-1" />
      </label>
      <label className="block text-xs">
        Client secret
        <Input
          type="password"
          value={clientSecret}
          onChange={(event) => setClientSecret(event.target.value)}
          className="mt-1"
        />
      </label>
      <label className="block text-xs">
        Webhook ID
        <Input value={webhookId} onChange={(event) => setWebhookId(event.target.value)} className="mt-1" />
      </label>
      <label className="block text-xs">
        Environment
        <select
          value={env}
          onChange={(event) => setEnv(event.target.value as 'sandbox' | 'live')}
          className="mt-1 h-9 w-full rounded-[6px] border bg-background px-3 text-sm"
        >
          <option value="sandbox">Sandbox</option>
          <option value="live">Live</option>
        </select>
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button size="sm" onClick={() => void connect()} disabled={busy}>
        {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
        Connect PayPal
      </Button>
    </div>
  )
}

export function SettingsPage() {
  const [settings, setSettings] = useState<MerchantSettings | null>(null)
  const [paypal, setPaypal] = useState<PayPalStatus | null>(null)
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [origin, setOrigin] = useState('')
  const [showPayPal, setShowPayPal] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [currency, setCurrency] = useState('USD')
  const [refundCap, setRefundCap] = useState('0')
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [timeoutMinutes, setTimeoutMinutes] = useState('120')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextSettings, nextPaypal, nextZones] = await Promise.all([
        merchantJson<MerchantSettings>('/settings'),
        merchantJson<PayPalStatus>('/settings/paypal').catch(() => null),
        merchantJson<DeliveryZone[]>('/delivery-zones'),
      ])
      setSettings(nextSettings)
      setPaypal(nextPaypal)
      setZones(nextZones)
      setCurrency(nextSettings.currency)
      setRefundCap(nextSettings.refund_cap)
      setReminderEnabled(nextSettings.recovery_reminder_enabled)
      setTimeoutMinutes(String(nextSettings.recovery_timeout_minutes))
    } catch (caught) {
      setError(errorMessage(caught, 'Could not load your settings.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setOrigin(window.location.origin)
    setUser(getStoredUser())
    void load()
  }, [load])

  const storeUrl = settings && origin ? `${origin}/store/${settings.slug}` : ''
  const chatUrl = settings && origin ? `${origin}/chat/${settings.slug}` : ''

  const save = async () => {
    if (!settings || saving) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const next = await merchantJson<MerchantSettings>('/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          currency,
          refund_cap: Number(refundCap) || 0,
          recovery_reminder_enabled: reminderEnabled,
          recovery_timeout_minutes: Math.round(Number(timeoutMinutes) || 120),
        }),
      })
      setSettings(next)
      setMessage('Settings saved')
      setTimeout(() => setMessage(''), 2000)
    } catch (caught) {
      setError(errorMessage(caught, 'Could not save your settings.'))
    } finally {
      setSaving(false)
    }
  }

  const disconnectPayPal = async () => {
    if (!window.confirm('Disconnect PayPal? New orders will not be able to request payment.')) return
    try {
      await merchantJson('/settings/paypal', { method: 'DELETE' })
      setPaypal({ connected: false, env: null })
      setSettings((current) =>
        current ? { ...current, paypal_connected: false } : current,
      )
    } catch (caught) {
      setError(errorMessage(caught, 'Could not disconnect PayPal.'))
    }
  }

  const zoneSummary = useMemo(() => {
    if (!zones.length) return 'No delivery zones'
    return `${zones.length} zone${zones.length === 1 ? '' : 's'} · ${zones
      .slice(0, 2)
      .map((zone) => zone.name)
      .join(', ')}${zones.length > 2 ? '…' : ''}`
  }, [zones])

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Workspace
        </p>
        <h1 className="mt-1 text-3xl">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Store identity, payments, and customer recovery.
        </p>
        <span className="mt-3 block h-px w-20 bg-[linear-gradient(90deg,var(--primary),transparent)]" />
      </div>

      {error && (
        <div className="mb-5 rounded-[8px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading || !settings ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Loading settings…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[10px]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings2 className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Store</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-muted-foreground">
                  Store name
                  <Input value={settings.name} readOnly className="mt-1" />
                </label>
                <label className="text-xs text-muted-foreground">
                  Store slug
                  <Input value={settings.slug} readOnly className="mt-1 font-mono" />
                </label>
              </div>
              <label className="block text-xs text-muted-foreground">
                Store currency
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="mt-1 h-9 w-full rounded-[6px] border bg-background px-3 text-sm"
                >
                  {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <p className="text-xs text-muted-foreground">Public store link</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-[6px] border bg-muted/30 px-3 py-2 text-xs">
                    {storeUrl}
                  </code>
                  <CopyButton value={storeUrl} label="Copy" />
                </div>
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline underline-offset-4"
                >
                  Open store <ExternalLink className="size-3" />
                </a>
              </div>
              {chatUrl && (
                <div>
                  <p className="text-xs text-muted-foreground">Direct chat link</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-[6px] border bg-muted/30 px-3 py-2 text-xs">
                      {chatUrl}
                    </code>
                    <CopyButton value={chatUrl} label="Copy" />
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{zoneSummary}</p>
            </CardContent>
          </Card>

          <Card className="rounded-[10px]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Customer recovery</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block text-xs text-muted-foreground">
                Refund cap
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={refundCap}
                  onChange={(event) => setRefundCap(event.target.value)}
                  className="mt-1 font-mono"
                />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-[6px] border px-3 py-3 text-sm">
                <span>
                  Send recovery reminders
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Nudge customers who leave an order unpaid.
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={reminderEnabled}
                  onChange={(event) => setReminderEnabled(event.target.checked)}
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Recovery timeout (minutes)
                <Input
                  type="number"
                  min="15"
                  max="10080"
                  value={timeoutMinutes}
                  onChange={(event) => setTimeoutMinutes(event.target.value)}
                  className="mt-1 font-mono"
                />
              </label>
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  {message || 'Currency changes are blocked once products use the current currency.'}
                </p>
                <Button onClick={() => void save()} disabled={saving}>
                  {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[10px]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Link2 className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">PayPal</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant={paypal?.connected ? 'default' : 'secondary'}>
                    {paypal?.connected ? `Connected · ${paypal.env ?? 'PayPal'}` : 'Not connected'}
                  </Badge>
                  {settings.paypal_connected && (
                    <span className="text-xs text-muted-foreground">Payment links are live.</span>
                  )}
                </div>
                {paypal?.connected ? (
                  <Button variant="outline" size="sm" onClick={() => void disconnectPayPal()}>
                    Disconnect
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setShowPayPal((value) => !value)}>
                    {showPayPal ? 'Hide form' : 'Connect PayPal'}
                  </Button>
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Use the credentials from your PayPal developer app. Webhook events are verified
                before an order is marked paid.
              </p>
              {!paypal?.connected && showPayPal && (
                <PayPalForm
                  onConnected={(status) => {
                    setPaypal(status)
                    setSettings((current) =>
                      current ? { ...current, paypal_connected: status.connected } : current,
                    )
                    setShowPayPal(false)
                  }}
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[10px]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Team</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-[6px] border px-3 py-3">
                <div>
                  <p className="text-sm font-medium">{user?.email ?? 'Signed-in owner'}</p>
                  <p className="text-xs text-muted-foreground">{user?.role ?? 'Owner'}</p>
                </div>
                <Badge variant="secondary">Owner</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Team invitations are not available in this workspace yet.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
