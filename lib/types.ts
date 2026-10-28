export type OrderStatus = 'draft' | 'confirmed' | 'pending_payment' | 'paid' | 'fulfilled' | 'cancelled' | 'expired'
export type ConversationStatus = 'ai' | 'handoff_requested' | 'human_active' | 'closed'
export type MessageRole = 'customer' | 'agent' | 'staff' | 'system' | 'tool'

export interface ProductVariant { id: string; name: string; options: string[]; priceOverride?: number; stock: number }
export interface Product { id: string; name: string; description: string; price: number; currency: string; active: boolean; imageUrls: string[]; variants: ProductVariant[] }
export interface OrderItem { nameSnapshot: string; variantSnapshot: string; qty: number; unitPrice: number }
export interface Order { id: string; status: OrderStatus; currency: string; subtotal: number; deliveryFee: number; total: number; items: OrderItem[]; deliveryDetails: string; approvalLink: string }
export interface ChatMessage { id: string; role: MessageRole; text: string; time: string }
