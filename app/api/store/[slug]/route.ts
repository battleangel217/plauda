import { NextResponse } from 'next/server'
import { getStore } from '@/lib/server-api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  return NextResponse.json(await getStore(slug))
}
