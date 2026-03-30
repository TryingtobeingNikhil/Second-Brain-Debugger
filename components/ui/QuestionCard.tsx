'use client'

import { useState } from 'react'
import { Question, DepthLevel } from '@/lib/types/analysis'

const DEPTH_CONFIG: Record<DepthLevel, { label: string; accent: string; glow: string }> = {
  surface:     { label: 'Surface',     accent: '#94a3b8', glow: 'rgba(148,163,184,0.15)' },
  deep:        { label: 'Deep',        accent: '#8b5cf6', glow: 'rgba(139,92,246,0.2)' },
  existential: { label: 'Existential', accent: '#ef4444', glow: 'rgba(239,68,68,0.2)' },
}

interface QuestionCardProps {
  question: Question
  index?: number
}

export function QuestionCard({ question, index = 0 }: QuestionCardProps) {
  const [hovered, setHovered] = useState(false)
  const depth = DEPTH_CONFIG[question.depth_level] ?? DEPTH_CONFIG.deep

  // Existential questions animate in last
  const staggerDelay = question.depth_level === 'existential'
    ? (index * 100) + 300
    : index * 80

  return (
    <div
      className="rounded-xl border p-5 cursor-default transition-all duration-300"
      style={{
        borderColor: hovered ? `${depth.accent}40` : 'rgba(255,255,255,0.07)',
        background: hovered ? `${depth.accent}06` : 'rgba(255,255,255,0.02)',
        boxShadow: hovered ? `0 0 20px ${depth.glow}` : 'none',
        animationDelay: `${staggerDelay}ms`,
        animation: 'sectionReveal 400ms cubic-bezier(0.16,1,0.3,1) both',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-3">
        {/* Depth badge */}
        <div
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5"
          style={{
            background: `${depth.accent}18`,
            color: depth.accent,
            border: `1px solid ${depth.accent}35`,
          }}
        >
          ?
        </div>

        <div className="flex-1 min-w-0">
          {/* Question */}
          <p className="ai-text text-sm font-medium text-white/85 leading-relaxed mb-2">
            {question.question}
          </p>

          {/* Why this question matters — fades in on hover */}
          <p
            className="ai-text text-xs text-white/40 leading-relaxed italic"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 300ms cubic-bezier(0.16,1,0.3,1), transform 300ms cubic-bezier(0.16,1,0.3,1)',
              maxHeight: hovered ? '100px' : '0px',
              overflow: 'hidden',
            }}
          >
            {question.why_this_question_matters}
          </p>

          {/* Depth label */}
          <div
            className="mt-3 text-[9px] font-semibold tracking-[0.18em] uppercase"
            style={{ color: depth.accent }}
          >
            {depth.label}
          </div>
        </div>
      </div>
    </div>
  )
}
