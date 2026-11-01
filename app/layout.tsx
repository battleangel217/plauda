import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'Plauda — Your AI sales employee', description: 'Turn conversations into confident checkouts with Plauda.', generator: 'v0.app' }
export const viewport: Viewport = { colorScheme: 'light dark', themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f8fafc' }, { media: '(prefers-color-scheme: dark)', color: '#0f172a' }] }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
