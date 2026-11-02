import { Shell } from '@/components/shell'
import { OrdersPage } from '@/components/orders-page'

export default async function OrderDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Shell>
      <OrdersPage detailId={id} />
    </Shell>
  )
}
