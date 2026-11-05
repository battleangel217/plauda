import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { proxySseRequest } from '@/lib/backend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  void (await params)
  const conversationId = request.nextUrl.searchParams.get('conversationId')?.trim()
  if (!conversationId) {
    return NextResponse.json({ error: 'A conversationId is required' }, { status: 400 })
  }

  return proxySseRequest(
    request,
    `/public/conversations/${encodeURIComponent(conversationId)}/stream`,
  )
}
