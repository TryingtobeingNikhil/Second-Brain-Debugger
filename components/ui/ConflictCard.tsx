'use client'

import { useState } from 'react'
import { Conflict } from '@/lib/types/analysis'
import { GlowCard } from './GlowCard'

const SEVERITY_COLOR = (s: number) => {
  if (s >= 8) return '#ef4444'
  if (s >= 5) return '#f97316'
  return '#eab308'
}

const TYPE_LABEL: Record<string, string> = {
  values_clash:           'Values Clash',
  desire_vs_fear:         'Desire vs Fear',
  identity_conflict:      'Identity Conflict',
  short_vs_long_term:     'Short vs Long Term',
  expectation_vs_reality: 'Expectation vs Reality',
  should_vs_want:         'Should vs Want',
}

interface ConflictCardProps {
  conflict: Conflict
}

export function ConflictCard({ conflict }: ConflictCardProps) {
  const [hinting, setHinting] = useState(false)
  const color = SEVERITY_COLOR(conflict.severity)
  const isHighSeverity = conflict.severity > 7

  return (
    <GlowCard
      glowColor={color}
      className={isHighSeverity ? 'conflict-pulse' : ''}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <span
          className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border"
          style={{ borderColor: `${color}44`, color, background: `${color}15` }}
        >
          {TYPE_LABEL[conflict.conflict_type] ?? conflict.conflict_type}
        </span>

        {/* Severity meter */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-[3px] h-3 rounded-sm transition-all duration-300"
                style={{ background: i < conflict.severity ? color : 'rgba(255,255,255,0.07)' }}
              />
            ))}
          </div>
          <span className="text-xs font-bold tabular-nums font-mono" style={{ color }}>
            {conflict.severity}/10
          </span>
        </div>
      </div>

      {/* Two thoughts side by side with ⚡ */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2">
          <p className="text-[9px] text-white/30 font-mono mb-1 uppercase tracking-widest">{conflict.thought_a_id}</p>
          <p className="ai-text text-xs text-white/70 leading-relaxed line-clamp-3">
            {conflict.description.split('vs')[0]?.trim() || conflict.thought_a_id}
          </p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <span className="text-lg" style={{ color }}>⚡</span>
        </div>
        <div className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2">
          <p className="text-[9px] text-white/30 font-mono mb-1 uppercase tracking-widest">{conflict.thought_b_id}</p>
          <p className="ai-text text-xs text-white/70 leading-relaxed line-clamp-3">
            {conflict.description.split('vs')[1]?.trim() || conflict.thought_b_id}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="ai-text text-sm text-white/60 leading-relaxed mb-3">{conflict.description}</p>

      {/* Resolution hint — fade in on hover */}
      <div
        className="relative"
        onMouseEnter={() => setHinting(true)}
        onMouseLeave={() => setHinting(false)}
      >
        <div
          className="rounded-lg border px-4 py-3 cursor-default transition-all duration-300"
          style={{
            borderColor: hinting ? `${color}30` : 'rgba(255,255,255,0.06)',
            background: hinting ? `${color}08` : 'rgba(255,255,255,0.03)',
          }}
        >
          <p className="text-[10px] font-medium tracking-widest uppercase mb-1" style={{ color: hinting ? color : '#475569' }}>
            Resolution hint {!hinting && '• hover to reveal'}
          </p>
          <p
            className="ai-text text-sm text-white/70 leading-relaxed"
            style={{
              opacity: hinting ? 1 : 0,
              transform: hinting ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 300ms cubic-bezier(0.16,1,0.3,1), transform 300ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {conflict.resolution_hint}
          </p>
        </div>
      </div>
    </GlowCard>
  )
}
