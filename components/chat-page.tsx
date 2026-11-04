'use client'

import { ChatThread } from '@/components/chat-thread'
import type { ChatMessage, Order } from '@/lib/types'

interface ChatPageProps {
  merchantName?: string
  slug?: string
  messages?: ChatMessage[]
  order?: Order
}

export function ChatPage({ merchantName, slug, messages, order }: ChatPageProps) {
  return (
    <main className="flex h-[100svh] flex-col bg-background">
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col bg-background md:border-x">
        <ChatThread
          merchantName={merchantName}
          slug={slug}
          initialMessages={messages}
          order={order}
        />
      </div>
    </main>
  )
}
