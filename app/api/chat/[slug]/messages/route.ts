import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { proxyJsonRequest } from '@/lib/backend'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  void (await params)
  const conversationId = request.nextUrl.searchParams.get('conversationId')?.trim()
  if (!conversationId) {
    return NextResponse.json({ error: 'A conversationId is required' }, { status: 400 })
  }

  const limit = request.nextUrl.searchParams.get('limit') ?? '100'
  const offset = request.nextUrl.searchParams.get('offset') ?? '0'
  const query = new URLSearchParams({ limit, offset })

  return proxyJsonRequest(
    request,
    `/public/conversations/${encodeURIComponent(conversationId)}/messages?${query.toString()}`,
  )
}
