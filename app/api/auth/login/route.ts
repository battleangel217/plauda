import type { NextRequest } from 'next/server'
import { proxyJsonRequest } from '@/lib/backend'

export async function POST(request: NextRequest) {
  const body = await request.text().catch(() => '')
  return proxyJsonRequest(request, '/auth/login', { method: 'POST', body })
}
