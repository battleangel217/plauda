import { CheckoutPage } from '@/components/checkout-page'
import { getOrder } from '@/lib/server-api'

export default async function CheckoutRoute({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const snapshot = await getOrder(orderId)
  return <CheckoutPage {...snapshot} />
}
