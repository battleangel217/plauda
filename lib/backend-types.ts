export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'pending_payment'
  | 'paid'
  | 'fulfilled'
  | 'cancelled'
  | 'expired'

export type ConversationStatus = 'ai' | 'handoff_requested' | 'human_active' | 'closed'
export type MessageRole = 'customer' | 'agent' | 'staff' | 'system' | 'tool'

/** Public store meta returned by GET /public/chat/:slug/meta. */
export interface PublicStoreMeta {
  name: string
  slug: string
  currency: string
  chat_link: string
}

/** Response from POST /public/chat/:slug/conversations. */
export interface VisitorConversation {
  conversation_id: string
  visitor_token: string
  status: ConversationStatus
  started_at: string
}

export interface ConversationSummary {
  id: string
  status: ConversationStatus
  channel: string
  customer_name: string | null
  customer_contact: string | null
  handoff_reason: string | null
  last_message_at: string
  started_at: string
}

export interface MessageMeta {
  kind?: 'chat' | 'handoff' | 'payment' | 'receipt' | 'reminder' | string
  [key: string]: unknown
}

export interface ApiMessage {
  id: string
  role: MessageRole
  content: string
  meta: MessageMeta
  created_at: string
}

export interface MessagePage {
  items: ApiMessage[]
  total: number
  limit: number
  offset: number
}

export interface OrderItem {
  product_id: string | null
  variant_id: string | null
  name: string
  variant: { name: string; options: Record<string, unknown> } | null
  qty: number
  unit_price: string
}

export interface DeliveryDetails {
  zone_id?: string
  zone_name?: string
  fee?: string
  eta_days?: number
  address?: string
}

/** Order card from an order_update event. Money is a decimal string. */
export interface Order {
  id: string
  status: OrderStatus
  currency: string
  items: OrderItem[]
  subtotal: string | null
  delivery_fee: string | null
  total: string | null
  delivery_details: DeliveryDetails | null
  approval_link: string | null
}

export interface AuthMerchant {
  id: string
  name: string
  slug: string
  currency: string
}

export interface AuthUser {
  id: string
  email: string
  role: string
  merchant: AuthMerchant
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

export interface DashboardSummary {
  as_of: string
  day_start: string
  currency: string
  revenue_today: string
  orders_today: number
  paid_orders_today: number
  pending_payment_orders: number
  live_chats: number
  handoff_requests: number
  total_revenue: string
  total_orders: number
}

export interface MerchantOrderItem {
  id: string
  product_id: string | null
  variant_id: string | null
  name_snapshot: string
  variant_snapshot: { name?: string; options?: Record<string, unknown> } | null
  qty: number
  unit_price: string
  line_total: string
}

export interface MerchantOrderSummary {
  id: string
  status: string
  currency: string
  total: string | null
  item_count: number
  created_at: string
  updated_at: string
}

export interface MerchantOrder {
  id: string
  conversation_id: string | null
  customer_id: string | null
  status: string
  currency: string
  subtotal: string | null
  delivery_fee: string | null
  total: string | null
  delivery_details: DeliveryDetails | null
  paypal_order_id: string | null
  approval_link: string | null
  reminder_count: number
  paid_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  items: MerchantOrderItem[]
}

export interface MerchantOrderPage {
  items: MerchantOrderSummary[]
  total: number
  limit: number
  offset: number
}

export interface ProductVariant {
  id: string
  name: string
  options: Record<string, unknown>
  price_override: string | null
  stock: number
}

export interface Product {
  id: string
  name: string
  description: string
  price: string
  currency: string
  active: boolean
  image_urls: string[]
  created_at: string
  updated_at: string
  variants: ProductVariant[]
}

export interface DeliveryZone {
  id: string
  name: string
  areas: string[]
  fee: string
  eta_days: number
  created_at: string
  updated_at: string
}

export interface BusinessInfoDoc {
  source: string
  content: string
  updated_at: string | null
}

export interface MerchantSettings {
  name: string
  slug: string
  currency: string
  refund_cap: string
  recovery_reminder_enabled: boolean
  recovery_timeout_minutes: number
  paypal_connected: boolean
  chat_link: string
}

export interface PayPalStatus {
  connected: boolean
  env: string | null
}

export interface ConversationSummaryOut {
  id: string
  status: ConversationStatus
  channel: string
  customer_name: string | null
  customer_contact: string | null
  handoff_reason: string | null
  last_message_at: string | null
  started_at: string
}

export interface ConversationDetail extends ConversationSummaryOut {
  customer_id: string | null
  summary: string | null
  latest_order_id: string | null
}

export interface ConversationPage {
  items: ConversationSummaryOut[]
  total: number
  limit: number
  offset: number
}

export interface AuditEntry {
  id: string
  order_id: string
  order_status: string
  currency: string
  action: string
  trigger: string
  amount: string | null
  result: string
  detail: Record<string, unknown>
  created_at: string
}

export interface AuditPage {
  items: AuditEntry[]
  total: number
  limit: number
  offset: number
}

export type ChatTurnEvent =
  | { type: 'delta'; text: string }
  | { type: 'tool_status'; tool: string; state: 'started' | 'done'; label: string }
  | { type: 'order_update'; order: Order }
  | { type: 'system'; kind: string; text: string }
  | { type: 'error'; code: string; message: string }
  | { type: 'done' }

export type LiveEvent =
  | { type: 'message'; conversation_id: string; message: ApiMessage }
  | { type: 'conversation_update'; conversation: ConversationSummary }
  | { type: 'order_update'; order: Order }
