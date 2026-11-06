'use client'

import { ChatThread } from '@/components/chat-thread'

interface ChatPageProps {
  merchantName: string
  slug: string
}

export function ChatPage({ merchantName, slug }: ChatPageProps) {
  return (
    <main className="flex h-[100svh] flex-col bg-background">
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col bg-background bg-[radial-gradient(ellipse_90%_35%_at_50%_0%,rgba(217,70,31,0.08),transparent_70%)] md:border-x">
        <ChatThread key={slug} merchantName={merchantName} slug={slug} />
      </div>
    </main>
  )
}
