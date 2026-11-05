export type OrderStatus = 'draft' | 'confirmed' | 'pending_payment' | 'paid' | 'fulfilled' | 'cancelled' | 'expired'
export type ConversationStatus = 'ai' | 'handoff_requested' | 'human_active' | 'closed'
export type MessageRole = 'customer' | 'agent' | 'staff' | 'system' | 'tool'

export interface ProductVariant { id: string; name: string; options: string[]; priceOverride?: number; stock: number }
export interface Product { id: string; name: string; description: string; price: number; currency: string; active: boolean; imageUrls: string[]; variants: ProductVariant[] }
export interface OrderItem { nameSnapshot: string; variantSnapshot: string; qty: number; unitPrice: number }
export interface Order { id: string; status: OrderStatus; currency: string; subtotal: number; deliveryFee: number; total: number; items: OrderItem[]; deliveryDetails: string; approvalLink: string }
export interface ChatMessage { id: string; role: MessageRole; text: string; time: string }

export interface Merchant { name: string; slug: string; email: string; tagline: string }
export interface DeliveryOption { label: string; eta: string; fee: number }
export interface CheckoutCustomer { name: string; email: string; address: string }

export interface StoreChat {
  sessionId?: string
  messages: ChatMessage[]
  order?: Order
}

export interface StoreSnapshot {
  merchant: Merchant
  products: Product[]
  delivery: DeliveryOption
  chat: StoreChat
}

export interface CheckoutSnapshot {
  order: Order
  merchant: Merchant
  customer: CheckoutCustomer
}

export interface ChatReply {
  sessionId: string
  messages: ChatMessage[]
  order?: Order
}

export interface PaymentResult {
  order: Order
  payment: {
    status: 'paid' | 'pending'
    paidAt?: string
    paypalId?: string
    approvalUrl?: string
  }
}
