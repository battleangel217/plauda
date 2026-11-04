import { ChatPage } from '@/components/chat-page'
import { getStore } from '@/lib/server-api'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const store = await getStore(slug)
  return (
    <ChatPage
      merchantName={store.merchant.name}
      slug={slug}
      messages={store.chat.messages}
      order={store.chat.order}
    />
  )
}
