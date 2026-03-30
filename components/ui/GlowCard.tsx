'use client'

import { ReactNode, useRef, useEffect, useState } from 'react'

interface GlowCardProps {
  children: ReactNode
  glowColor?: string
  accent?: string
  className?: string
}

export function GlowCard({ children, glowColor, accent, className = '' }: GlowCardProps) {
  const color = glowColor ?? accent
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const baseStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(12px)',
    transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1), transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
  }

  const glowStyle: React.CSSProperties = color
    ? { boxShadow: `0 0 0 1px ${color}22, 0 0 24px ${color}11` }
    : {}

  return (
    <div
      ref={ref}
      className={`glow-card relative rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 overflow-hidden ${className}`}
      style={{ ...baseStyle, ...glowStyle }}
    >
      {color && (
        <div
          className="absolute inset-x-0 top-0 h-px opacity-60 pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
      )}
      {children}
    </div>
  )
}
