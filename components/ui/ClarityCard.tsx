'use client'

import { useState, useRef, useEffect } from 'react'
import { Clarity } from '@/lib/types/analysis'
import { Typewriter } from './Typewriter'
import { Shimmer } from './Shimmer'

interface ClarityCardProps {
  clarity: Clarity
  onComplete?: () => void
}

export function ClarityCard({ clarity, onComplete }: ClarityCardProps) {
  const [phase, setPhase] = useState<'typing' | 'revealing' | 'done'>('typing')
  const [impacted, setImpacted] = useState(false)
  const hasPlayed = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const onClarityComplete = () => {
    if (hasPlayed.current) return
    hasPlayed.current = true

    // 1. Border pulse
    setImpacted(true)
    // 2. Signal page to dim bg
    onComplete?.()

    // After 600ms start revealing sub-cards
    setTimeout(() => {
      setPhase('revealing')
    }, 600)

    setTimeout(() => {
      setPhase('done')
    }, 900)
  }

  return (
    <div
      ref={cardRef}
      className="rounded-xl border p-6 transition-all duration-[600ms] ease-out"
      style={{
        background: '#0f0f18',
        borderColor: impacted ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.15)',
        boxShadow: impacted
          ? '0 0 0 1px rgba(16,185,129,0.5), 0 0 40px rgba(16,185,129,0.12)'
          : '0 0 0 1px rgba(16,185,129,0.1)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px rounded-t-xl"
        style={{ background: 'linear-gradient(90deg, transparent, #10b981, transparent)' }}
      />

      {/* Label */}
      <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[#10b981]/60 mb-4">
        Core Clarity
      </p>

      {/* Core truth — typewriter only */}
      <p
        className="ai-text leading-[1.8] tracking-[0.01em] mb-6"
        style={{ fontSize: '1.1rem', color: '#f1f5f9' }}
      >
        <Typewriter
          text={clarity.core_truth}
          speed={22}
          pauseOnPunctuation
          onComplete={onClarityComplete}
          cursorClass="typewriter-cursor"
        />
      </p>

      {/* Sub-cards: reveal after typewriter done */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Underlying need */}
        {phase === 'typing' ? (
          <Shimmer width="100%" height="80px" />
        ) : (
          <div
            className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4"
            style={{
              opacity: 1,
              transform: 'translateY(0)',
              transition: 'opacity 400ms cubic-bezier(0.16,1,0.3,1), transform 400ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[#10b981]/50 mb-2">
              Underlying Need
            </p>
            <p className="ai-text text-sm text-white/70 leading-relaxed">{clarity.underlying_need}</p>
          </div>
        )}

        {/* What you're avoiding */}
        {phase === 'typing' ? (
          <Shimmer width="100%" height="80px" />
        ) : (
          <div
            className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4"
            style={{
              opacity: 1,
              transform: 'translateY(0)',
              transition: 'opacity 500ms 100ms cubic-bezier(0.16,1,0.3,1), transform 500ms 100ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[#ef4444]/50 mb-2">
              What You&apos;re Avoiding
            </p>
            <p className="ai-text text-sm text-white/70 leading-relaxed">{clarity.what_youre_avoiding}</p>
          </div>
        )}
      </div>
    </div>
  )
}
