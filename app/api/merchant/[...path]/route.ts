import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { proxyJsonRequest, proxySseRequest } from '@/lib/backend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ path: string[] }> }

async function handle(request: NextRequest, { params }: RouteContext) {
  const { path } = await params
  if (!path?.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const backendPath = `/${path.map((part) => encodeURIComponent(part)).join('/')}${request.nextUrl.search}`

  if (request.method === 'GET' && path.join('/') === 'conversations/stream') {
    return proxySseRequest(request, backendPath)
  }

  const body =
    request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.text().catch(() => '')

  return proxyJsonRequest(request, backendPath, {
    method: request.method,
    ...(body ? { body } : {}),
  })
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
}
