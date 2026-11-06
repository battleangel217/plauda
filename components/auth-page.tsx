'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND_NAME, storeUrl } from '@/lib/brand'
import { saveAuth } from '@/lib/auth-client'
import type { TokenResponse } from '@/lib/backend-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Public demo login shown on the sign-in page for testers.
const DEMO_EMAIL = 'lumagoods@gmail.com'
const DEMO_PASSWORD = 'thisisapassword'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'your-business'
}

function Receipt() {
  return (
    <div className="mt-8 w-full max-w-[300px] border border-border bg-card p-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-muted-foreground">ORDER #PLD-1048</span>
        <span className="border border-[#3F6B4F]/30 px-2 py-0.5 text-[10px] font-medium text-[#3F6B4F]">
          Paid
        </span>
      </div>
      <div className="mt-5 space-y-2 font-mono text-xs">
        <div className="flex justify-between">
          <span>Canvas Tote</span>
          <span>$28.00</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <span>$4.00</span>
        </div>
        <div className="border-t border-dashed border-border pt-2">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>$32.00</span>
          </div>
        </div>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">Packed by Plauda</p>
    </div>
  )
}

function BrandPanel() {
  return (
    <section className="flex flex-col border-b border-border px-6 py-7 md:px-10 lg:min-h-screen lg:w-[45%] lg:border-b-0 lg:border-r lg:py-10 xl:px-16">
      <a href="/login" className="font-serif text-2xl font-semibold lowercase tracking-tight">
        {BRAND_NAME}
      </a>
      <div className="mt-12 lg:mt-auto">
        <p className="max-w-md font-serif text-4xl leading-[1.05] tracking-tight md:text-5xl">
          Your shop, answering customers at 3am.
        </p>
        <Receipt />
      </div>
    </section>
  )
}

function errorMessage(status: number, detail?: string) {
  if (status === 409) return 'That email is already registered.'
  if (status === 401) return 'We could not sign you in with those details.'
  if (status === 422) return detail || 'Please check your details and try again.'
  return detail || 'Something went wrong. Please try again.'
}

export function AuthPage({ register }: { register: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setExpired(new URLSearchParams(window.location.search).get('expired') === '1')
  }, [])

  const slug = useMemo(() => slugify(businessName), [businessName])
  const strength = password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Okay' : 'Weak'
  const emailInvalid = touched.email && (!email || !email.includes('@'))
  const passwordInvalid = touched.password && password.length < 8
  const mismatch = touched.confirm && password !== confirm

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched({ email: true, password: true, confirm: register })
    setError('')

    if (
      !email ||
      !email.includes('@') ||
      password.length < 8 ||
      (register && (!businessName || password !== confirm))
    ) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(register ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          register
            ? { store_name: businessName.trim(), email: email.trim(), password }
            : { email: email.trim(), password },
        ),
      })

      let body: (TokenResponse & { detail?: unknown }) | { detail?: unknown } = {}
      try {
        body = (await response.json()) as TokenResponse & { detail?: unknown }
      } catch {
        // Keep the status-based error below.
      }

      if (!response.ok) {
        const detail = 'detail' in body && typeof body.detail === 'string' ? body.detail : undefined
        setError(errorMessage(response.status, detail))
        return
      }

      if (!('access_token' in body) || !body.access_token || !body.user) {
        setError('The server returned an unexpected response. Please try again.')
        return
      }

      saveAuth(body.access_token, body.user)
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('We could not reach the server. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setTouched({})
    setError('')
  }

  return (
    <main className="flex min-h-screen flex-col bg-background lg:flex-row">
      <BrandPanel />
      <section className="flex flex-1 items-center px-6 py-10 md:px-10 lg:px-16">
        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h1 className="font-serif text-3xl tracking-tight">
              {register ? 'Create your account' : 'Sign in'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {register
                ? 'Open your storefront and let AI handle the conversations.'
                : 'Manage your AI sales employee from one quiet workspace.'}
            </p>
          </div>

          {expired && (
            <div className="mb-5 border border-border bg-muted/40 px-3 py-2.5 text-sm">
              Your session expired. Sign in again.
            </div>
          )}

          {!register && (
            <div className="mb-5 border border-dashed border-border bg-muted/30 px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Demo account</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{DEMO_EMAIL}</p>
                  <p className="font-mono text-xs text-muted-foreground">{DEMO_PASSWORD}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={fillDemo}>
                  Fill demo login
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
            {register && (
              <div>
                <label htmlFor="business" className="mb-2 block text-sm">
                  Business name
                </label>
                <Input
                  id="business"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Luma Goods"
                  autoComplete="organization"
                />
                <p
                  className={`mt-2 font-mono text-xs ${
                    businessName ? 'text-muted-foreground' : 'text-muted-foreground/50'
                  }`}
                >
                  {storeUrl(slug)}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="mb-2 block text-sm">
                Email
              </label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => setTouched((value) => ({ ...value, email: true }))}
                placeholder="you@business.com"
                autoComplete="email"
                aria-invalid={emailInvalid}
              />
              {emailInvalid && (
                <p className="mt-1.5 text-xs text-[#9B4130]">Enter a valid email address.</p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="auth-password" className="text-sm">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <Input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() => setTouched((value) => ({ ...value, password: true }))}
                placeholder="At least 8 characters"
                autoComplete={register ? 'new-password' : 'current-password'}
                aria-invalid={passwordInvalid}
              />
              {register && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-0.5 flex-1 bg-border">
                    <div
                      className="h-full bg-foreground transition-all"
                      style={{
                        width:
                          password.length >= 12
                            ? '100%'
                            : password.length >= 8
                              ? '62%'
                              : password.length
                                ? '28%'
                                : '0%',
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-muted-foreground">{strength}</span>
                </div>
              )}
              {passwordInvalid && (
                <p className="mt-1.5 text-xs text-[#9B4130]">
                  Password must be at least 8 characters.
                </p>
              )}
            </div>

            {register && (
              <div>
                <label htmlFor="confirm" className="mb-2 block text-sm">
                  Confirm password
                </label>
                <Input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  onBlur={() => setTouched((value) => ({ ...value, confirm: true }))}
                  autoComplete="new-password"
                  aria-invalid={mismatch}
                />
                {mismatch && (
                  <p className="mt-1.5 text-xs text-[#9B4130]">Passwords do not match.</p>
                )}
              </div>
            )}

            <Button type="submit" className="mt-1 w-full rounded-[6px]" disabled={loading}>
              {loading
                ? register
                  ? 'Creating account…'
                  : 'Signing in…'
                : register
                  ? 'Create account'
                  : 'Sign in'}
            </Button>

            {error && (
              <p
                role="alert"
                className="border border-[#9B4130]/30 bg-[#9B4130]/10 px-3 py-2.5 text-sm text-[#9B4130]"
              >
                {error}
              </p>
            )}
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            {register ? 'Already have an account? ' : 'New to Plauda? '}
            <a
              href={register ? '/login' : '/register'}
              className="text-foreground underline underline-offset-4"
            >
              {register ? 'Sign in' : 'Create an account'}
            </a>
          </p>
          {register && (
            <p className="mt-5 text-xs text-muted-foreground">
              You&apos;ll be the owner of this account.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
