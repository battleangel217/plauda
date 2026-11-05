import type { AuthUser } from '@/lib/backend-types'

const TOKEN_KEY = 'plauda_token'
const USER_KEY = 'plauda_user'
const AUTH_COOKIE = 'plauda_auth'

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function saveAuth(token: string, user: AuthUser) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
    window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    // Ignore storage failures; the cookie still guards the dashboard.
  }
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=604800; SameSite=Lax`
}

export function clearAuth() {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(USER_KEY)
  } catch {
    // Ignore storage failures.
  }
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

export function authHeaders(json = false) {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  if (json) headers['content-type'] = 'application/json'
  return headers
}
