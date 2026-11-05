'use client'

import { ChatThread } from '@/components/chat-thread'

interface ChatPageProps {
  merchantName: string
  slug: string
}

export function ChatPage({ merchantName, slug }: ChatPageProps) {
  return (
    <main className="flex h-[100svh] flex-col bg-background">
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col bg-background md:border-x">
        <ChatThread key={slug} merchantName={merchantName} slug={slug} />
      </div>
    </main>
  )
}
