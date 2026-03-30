'use client'

import { useState, useRef } from 'react'
import { Thought, EmotionHint } from '@/lib/types/analysis'

const EMOTION_COLORS: Record<EmotionHint, { border: string; text: string; bg: string; hex: string }> = {
  anxious:    { border: 'border-[#ef4444]/40', text: 'text-[#ef4444]',   bg: 'bg-[#ef4444]/10',  hex: '#ef4444' },
  excited:    { border: 'border-[#f59e0b]/40', text: 'text-[#f59e0b]',   bg: 'bg-[#f59e0b]/10',  hex: '#f59e0b' },
  confused:   { border: 'border-[#8b5cf6]/40', text: 'text-[#8b5cf6]',   bg: 'bg-[#8b5cf6]/10',  hex: '#8b5cf6' },
  conflicted: { border: 'border-[#ec4899]/40', text: 'text-[#ec4899]',   bg: 'bg-[#ec4899]/10',  hex: '#ec4899' },
  neutral:    { border: 'border-[#64748b]/40', text: 'text-[#64748b]',   bg: 'bg-[#64748b]/10',  hex: '#64748b' },
  hopeful:    { border: 'border-[#10b981]/40', text: 'text-[#10b981]',   bg: 'bg-[#10b981]/10',  hex: '#10b981' },
  defeated:   { border: 'border-[#475569]/40', text: 'text-[#475569]',   bg: 'bg-[#475569]/10',  hex: '#475569' },
}

const URGENCY_DOT: Record<number, string> = {
  1: '#475569', 2: '#64748b', 3: '#94a3b8',
  4: '#fbbf24', 5: '#f59e0b', 6: '#f97316',
  7: '#ef4444', 8: '#dc2626', 9: '#b91c1c', 10: '#991b1b',
}

interface ThoughtChipProps {
  thought: Thought
  index?: number
  dimmed?: boolean
  highlighted?: boolean
  onClick?: () => void
  id?: string
}

export function ThoughtChip({ thought, index = 0, dimmed = false, highlighted = false, onClick, id }: ThoughtChipProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const emotion = EMOTION_COLORS[thought.emotion_hint] ?? EMOTION_COLORS.neutral
  const urgency = Math.min(Math.max(Math.round(thought.urgency), 1), 10)
  const dotColor = URGENCY_DOT[urgency] ?? '#64748b'

  const chipStyle: React.CSSProperties = {
    animationDelay: `${index * 80}ms`,
    opacity: dimmed ? 0.3 : 1,
    border: highlighted ? `1px solid #6366f1` : undefined,
    transform: highlighted ? 'scale(1.03)' : undefined,
    transition: 'opacity 300ms cubic-bezier(0.16,1,0.3,1), transform 300ms cubic-bezier(0.16,1,0.3,1), border-color 300ms ease',
  }

  return (
    <div className="relative" style={{ animation: 'chipEntry 400ms cubic-bezier(0.16,1,0.3,1) both', animationDelay: `${index * 80}ms` }}>
      <button
        id={id}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={onClick}
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium cursor-pointer select-none ${emotion.border} ${emotion.text} ${emotion.bg} hover:scale-105 transition-transform duration-200`}
        style={chipStyle}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: dotColor }}
        />
        <span className="ai-text max-w-[200px] truncate">{thought.raw}</span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
          style={{ animation: 'sectionReveal 200ms cubic-bezier(0.16,1,0.3,1) both' }}
        >
          <div className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono whitespace-nowrap shadow-xl">
            <div className="text-white/60 mb-1">urgency: <span className="font-bold" style={{ color: dotColor }}>{thought.urgency}/10</span></div>
            <div style={{ color: emotion.hex }}>{thought.emotion_hint}</div>
            <div className="text-white/30 mt-1 text-[9px]">{thought.id}</div>
          </div>
          {/* Arrow */}
          <div className="w-2 h-2 bg-[#0f0f18] border-r border-b border-white/10 rotate-45 mx-auto -mt-1" />
        </div>
      )}
    </div>
  )
}
