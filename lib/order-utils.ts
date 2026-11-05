import type { DeliveryDetails } from '@/lib/backend-types'

export function formatMoney(value: string | null, currency: string) {
  if (value == null) return '—'
  const amount = Number(value)
  if (!Number.isFinite(amount)) return `${value} ${currency}`
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${value} ${currency}`
  }
}

export function deliveryText(details: DeliveryDetails | null) {
  if (!details) return 'Delivery not set'
  const parts = [
    details.zone_name,
    details.eta_days ? `${details.eta_days}-day delivery` : null,
    details.address,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Delivery details saved'
}

export const orderStatusLabel: Record<string, string> = {
  pending_payment: 'Payment pending',
  paid: 'Paid',
  fulfilled: 'Fulfilled',
  confirmed: 'Confirmed',
  draft: 'Draft',
  cancelled: 'Cancelled',
  expired: 'Expired',
}
