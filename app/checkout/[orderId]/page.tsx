import { CheckoutPage } from '@/components/checkout-page'

export default async function CheckoutRoute({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  return <CheckoutPage orderId={orderId} />
}
