import type { ChatMessage, Order, Product } from './types'

export const merchant = { name: 'Luma Goods', slug: 'luma-goods', email: 'hello@lumagoods.co' }
export const products: Product[] = [
  { id: 'p1', name: 'Everyday Tote', description: 'A durable canvas tote for everyday errands.', price: 38, currency: 'USD', active: true, imageUrls: ['/placeholder.jpg'], variants: [{ id: 'v1', name: 'Natural', options: ['Natural'], stock: 24 }] },
  { id: 'p2', name: 'Ceramic Travel Mug', description: 'Hand-finished stoneware with a leak-resistant lid.', price: 28, currency: 'USD', active: true, imageUrls: ['/placeholder.jpg'], variants: [{ id: 'v2', name: 'Sand', options: ['Sand'], stock: 12 }, { id: 'v3', name: 'Forest', options: ['Forest'], stock: 8 }] },
]
export const demoOrder: Order = { id: 'VOX-1048', status: 'pending_payment', currency: 'USD', subtotal: 66, deliveryFee: 6, total: 72, items: [{ nameSnapshot: 'Everyday Tote', variantSnapshot: 'Natural', qty: 1, unitPrice: 38 }, { nameSnapshot: 'Ceramic Travel Mug', variantSnapshot: 'Sand', qty: 1, unitPrice: 28 }], deliveryDetails: 'Standard delivery · 3–5 business days', approvalLink: 'https://www.paypal.com/checkoutnow?token=voxy-demo' }
export const initialMessages: ChatMessage[] = [
  { id: 'm1', role: 'agent', text: 'Hi there! I’m the AI assistant for Luma Goods. What can I help you find today?', time: '10:42 AM' },
  { id: 'm2', role: 'customer', text: 'I’m looking for a tote and a travel mug.', time: '10:43 AM' },
  { id: 'm3', role: 'agent', text: 'Great picks. I found an Everyday Tote in Natural and a Ceramic Travel Mug in Sand. I can put those together for you.', time: '10:43 AM' },
  { id: 'm4', role: 'tool', text: 'Stock checked', time: '10:43 AM' },
  { id: 'm5', role: 'system', text: 'Order VOX-1048 created · awaiting payment', time: '10:44 AM' },
]
export const recentOrders = [
  { id: 'VOX-1048', customer: 'Maya Chen', amount: '$72.00', status: 'pending_payment' },
  { id: 'VOX-1047', customer: 'Jordan Lee', amount: '$38.00', status: 'paid' },
  { id: 'VOX-1046', customer: 'Sam Rivera', amount: '$28.00', status: 'fulfilled' },
  { id: 'VOX-1045', customer: 'Avery Patel', amount: '$76.00', status: 'paid' },
]
