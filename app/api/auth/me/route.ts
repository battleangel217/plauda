import type { NextRequest } from 'next/server'
import { proxyJsonRequest } from '@/lib/backend'

export async function GET(request: NextRequest) {
  return proxyJsonRequest(request, '/auth/me')
}
