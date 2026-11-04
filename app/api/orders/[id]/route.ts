import { NextResponse } from 'next/server'
import { getOrder } from '@/lib/server-api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return NextResponse.json(await getOrder(id))
}
