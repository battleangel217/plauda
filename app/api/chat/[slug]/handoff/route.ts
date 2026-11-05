import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { backendFetch, jsonHeaders } from '@/lib/backend'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  void (await params)

  let body: { conversation_id?: unknown; reason?: unknown }
  try {
    body = (await request.json()) as { conversation_id?: unknown; reason?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const conversationId =
    typeof body.conversation_id === 'string' ? body.conversation_id.trim() : ''
  if (!conversationId) {
    return NextResponse.json({ error: 'A conversation_id is required' }, { status: 400 })
  }

  const reason = typeof body.reason === 'string' ? body.reason : undefined
  const response = await backendFetch(
    `/public/conversations/${encodeURIComponent(conversationId)}/handoff`,
    {
      method: 'POST',
      headers: jsonHeaders(request),
      body: JSON.stringify(reason ? { reason } : {}),
    },
  )

  const payload = await response.text()
  return new Response(payload, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  })
}
