'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return {
    ref,
    className: cn(
      'transition-[opacity,translate] duration-700 ease-out',
      visible
        ? 'translate-y-0 opacity-100'
        : 'translate-y-4 opacity-0 will-change-[opacity,translate]',
      'motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none',
    ),
    style: { transitionDelay: `${delay}ms` } satisfies CSSProperties,
  }
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reveal = useReveal(delay)

  return (
    <div ref={reveal.ref} className={cn(reveal.className, className)} style={reveal.style}>
      {children}
    </div>
  )
}
