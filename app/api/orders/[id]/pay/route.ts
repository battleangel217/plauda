import { NextResponse } from 'next/server'
import { payOrder } from '@/lib/server-api'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return NextResponse.json(await payOrder(id))
}
