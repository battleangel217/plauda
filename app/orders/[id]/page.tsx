import { OrdersPage } from '@/components/orders-page'

export default async function OrderDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OrdersPage detailId={id} />
}
