import { Analytics } from '@vercel/analytics/next'
import { GeistSerifTriangle } from 'geist/font/serif/triangle'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'Plauda — Your AI store assistant', description: 'Give your business a shareable storefront and an AI chat assistant that sells 24/7.', generator: 'v0.app' }
export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#14130F' }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${GeistSerifTriangle.variable} dark`}><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
