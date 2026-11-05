import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { proxyJsonRequest } from '@/lib/backend'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const body = await request.text().catch(() => '')
  return proxyJsonRequest(
    request,
    `/public/chat/${encodeURIComponent(slug)}/conversations`,
    { method: 'POST', body: body || '{}' },
  )
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
