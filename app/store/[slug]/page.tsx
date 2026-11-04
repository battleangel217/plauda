import { StorePage } from '@/components/store-page'
import { getStore } from '@/lib/server-api'

export default async function StoreRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const store = await getStore(slug)
  return <StorePage store={store} />
}
