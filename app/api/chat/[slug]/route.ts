import { NextResponse } from 'next/server'
import { sendChatMessage } from '@/lib/server-api'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  let body: { message?: unknown; sessionId?: unknown }
  try {
    body = (await request.json()) as { message?: unknown; sessionId?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.message !== 'string' || !body.message.trim()) {
    return NextResponse.json({ error: 'A message is required' }, { status: 400 })
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : undefined
  return NextResponse.json(await sendChatMessage(slug, body.message.trim(), sessionId))
}
