import type { ChatMessage, ConversationStatus, MessageRole, Order, Product } from './types'

export interface InboxMessage { id: string; role: MessageRole; text: string; time: string; staffName?: string }
export interface InboxConversation { id: string; customerName?: string; status: ConversationStatus; lastMessage: string; updatedAt: string; handoffReason: string; messages: InboxMessage[]; order?: Order; payment: { status: string; paypalId: string; approvalLink: string; paidAt?: string }; contact: { name?: string; phone?: string; email?: string } }

const inboxMessages = (name: string, status: ConversationStatus): InboxMessage[] => [
  { id: `${name}-1`, role: 'customer', text: status === 'handoff_requested' ? 'I have been waiting a while and would really like to speak with someone.' : 'Can you help me with my order?', time: '2:14 PM' },
  { id: `${name}-2`, role: 'agent', text: 'Absolutely — I’m checking the details and will help you get this sorted.', time: '2:15 PM' },
  { id: `${name}-3`, role: 'tool', text: 'Order details retrieved', time: '2:15 PM' },
  ...(status === 'human_active' ? [{ id: `${name}-4`, role: 'staff' as const, text: 'Hi, Alex here. I’m taking a look now.', time: '2:16 PM', staffName: 'Alex' }] : []),
]

const baseInboxOrder: Order = { id: 'VOX-1048', status: 'pending_payment', currency: 'USD', subtotal: 66, deliveryFee: 6, total: 72, items: [{ nameSnapshot: 'Everyday Tote', variantSnapshot: 'Natural', qty: 1, unitPrice: 38 }, { nameSnapshot: 'Ceramic Travel Mug', variantSnapshot: 'Sand', qty: 1, unitPrice: 28 }], deliveryDetails: 'Standard delivery · 3–5 business days', approvalLink: 'https://www.paypal.com/checkoutnow?token=plauda-demo' }

export const inboxConversations: InboxConversation[] = [
  { id: 'c1', customerName: 'Maya Chen', status: 'handoff_requested', lastMessage: 'I would really like to speak with someone.', updatedAt: '2m', handoffReason: 'Customer asked for a person', messages: inboxMessages('maya', 'handoff_requested'), order: baseInboxOrder, payment: { status: 'Pending', paypalId: '8TQ92145K', approvalLink: baseInboxOrder.approvalLink }, contact: { name: 'Maya Chen', phone: '+1 415 555 0192', email: 'maya@example.com' } },
  { id: 'c2', customerName: 'Jordan Lee', status: 'human_active', lastMessage: 'Hi, Alex here. I’m taking a look now.', updatedAt: '8m', handoffReason: 'Flagged: frustration detected', messages: inboxMessages('jordan', 'human_active'), order: { ...baseInboxOrder, id: 'VOX-1047', status: 'paid', total: 38, subtotal: 38, items: [baseInboxOrder.items[0]] }, payment: { status: 'Paid', paypalId: '5RM28014P', approvalLink: baseInboxOrder.approvalLink, paidAt: 'Today, 1:48 PM' }, contact: { name: 'Jordan Lee', email: 'jordan@example.com' } },
  { id: 'c3', customerName: 'Sam Rivera', status: 'ai', lastMessage: 'I found the Forest mug in stock.', updatedAt: '21m', handoffReason: '', messages: inboxMessages('sam', 'ai'), payment: { status: 'Not started', paypalId: '—', approvalLink: '—' }, contact: { name: 'Sam Rivera', email: 'sam@example.com' } },
  { id: 'c4', customerName: 'Avery Patel', status: 'handoff_requested', lastMessage: 'Do you have a faster delivery option?', updatedAt: '34m', handoffReason: 'Delivery question needs review', messages: inboxMessages('avery', 'handoff_requested'), order: { ...baseInboxOrder, id: 'VOX-1045', status: 'confirmed', total: 76 }, payment: { status: 'Approved', paypalId: '1XY55211A', approvalLink: baseInboxOrder.approvalLink, paidAt: 'Yesterday, 4:20 PM' }, contact: { name: 'Avery Patel', phone: '+1 212 555 0134' } },
  { id: 'c5', customerName: 'Nora Williams', status: 'closed', lastMessage: 'Thanks, that answered my question.', updatedAt: '1h', handoffReason: '', messages: inboxMessages('nora', 'closed'), payment: { status: 'Not started', paypalId: '—', approvalLink: '—' }, contact: { name: 'Nora Williams' } },
  { id: 'c6', status: 'ai', lastMessage: 'Is the tote available in black?', updatedAt: '2h', handoffReason: '', messages: inboxMessages('visitor', 'ai'), payment: { status: 'Not started', paypalId: '—', approvalLink: '—' }, contact: {} },
]


export const merchant = { name: 'Luma Goods', slug: 'luma-goods', email: 'hello@lumagoods.co' }
export const products: Product[] = [
  { id: 'p1', name: 'Everyday Tote', description: 'A durable canvas tote for everyday errands.', price: 38, currency: 'USD', active: true, imageUrls: ['/placeholder.jpg'], variants: [{ id: 'v1', name: 'Natural', options: ['Natural'], stock: 24 }] },
  { id: 'p2', name: 'Ceramic Travel Mug', description: 'Hand-finished stoneware with a leak-resistant lid.', price: 28, currency: 'USD', active: true, imageUrls: ['/placeholder.jpg'], variants: [{ id: 'v2', name: 'Sand', options: ['Sand'], stock: 12 }, { id: 'v3', name: 'Forest', options: ['Forest'], stock: 8 }] },
]
export const demoOrder: Order = { id: 'VOX-1048', status: 'pending_payment', currency: 'USD', subtotal: 66, deliveryFee: 6, total: 72, items: [{ nameSnapshot: 'Everyday Tote', variantSnapshot: 'Natural', qty: 1, unitPrice: 38 }, { nameSnapshot: 'Ceramic Travel Mug', variantSnapshot: 'Sand', qty: 1, unitPrice: 28 }], deliveryDetails: 'Standard delivery · 3–5 business days', approvalLink: 'https://www.paypal.com/checkoutnow?token=plauda-demo' }
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
