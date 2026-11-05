import { notFound } from 'next/navigation'
import { StorePage } from '@/components/store-page'
import { BackendError } from '@/lib/backend'
import { getPublicStoreMeta } from '@/lib/server-api'

export default async function StoreRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let store
  try {
    store = await getPublicStoreMeta(slug)
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) notFound()
    throw error
  }

  return <StorePage store={store} />
}
