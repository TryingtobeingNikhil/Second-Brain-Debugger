import { ReactNode } from 'react'

interface GlowCardProps {
  children: ReactNode
  accent?: string
  className?: string
}

export function GlowCard({ children, accent, className = '' }: GlowCardProps) {
  return (
    <div
      className={`relative rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-5 overflow-hidden ${className}`}
      style={accent ? { boxShadow: `0 0 0 1px ${accent}22, 0 0 24px ${accent}11` } : undefined}
    >
      {accent && (
        <div
          className="absolute inset-x-0 top-0 h-px opacity-60"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
      )}
      {children}
    </div>
  )
}
