import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { proxySseRequest } from '@/lib/backend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const body = await request.text().catch(() => '')
  if (!body) {
    return NextResponse.json({ error: 'A message body is required' }, { status: 400 })
  }

  return proxySseRequest(
    request,
    `/public/chat/${encodeURIComponent(slug)}/messages`,
    { method: 'POST', body },
  )
}
