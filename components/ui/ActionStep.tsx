'use client'

import { useState, useRef, useCallback } from 'react'
import { Action, EnergyLevel } from '@/lib/types/analysis'
import { GlowCard } from './GlowCard'

const ENERGY_CONFIG: Record<EnergyLevel, { label: string; color: string; bars: number }> = {
  low:    { label: 'Low energy',    color: '#10b981', bars: 1 },
  medium: { label: 'Medium energy', color: '#f59e0b', bars: 2 },
  high:   { label: 'High energy',   color: '#ef4444', bars: 3 },
}

function BatteryIcon({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex items-end gap-[2px] h-3">
      {[1, 2, 3].map(bar => (
        <div
          key={bar}
          className="w-[3px] rounded-sm transition-all duration-300"
          style={{
            height: `${(bar / 3) * 100}%`,
            background: bar <= level ? color : 'rgba(255,255,255,0.1)',
          }}
        />
      ))}
    </div>
  )
}

// SVG path overlay context is consumed via callbacks; we accept them as optional props
interface ActionStepProps {
  action: Action
  index?: number
  onDrawPath?: (fromEl: HTMLElement, conflictId: string) => void
  onClearPaths?: () => void
}

export function ActionStep({ action, index = 0, onDrawPath, onClearPaths }: ActionStepProps) {
  const [expanded, setExpanded] = useState(false)
  const energy = ENERGY_CONFIG[action.energy_required] ?? ENERGY_CONFIG.medium
  const selfRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = useCallback(() => {
    setExpanded(true)
    if (action.blocks_conflict_id && onDrawPath && selfRef.current) {
      onDrawPath(selfRef.current, action.blocks_conflict_id)
    }
  }, [action.blocks_conflict_id, onDrawPath])

  const handleMouseLeave = useCallback(() => {
    setExpanded(false)
    onClearPaths?.()
  }, [onClearPaths])

  return (
    <div ref={selfRef}>
      <GlowCard className="cursor-pointer" glowColor="rgba(99,102,241,0.15)">
        <div
          className="flex items-start gap-4"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Step number circle */}
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#6366f1]/15 border border-[#6366f1]/30 flex items-center justify-center text-sm font-bold text-[#6366f1] font-mono">
            {action.step_number}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="ai-text text-sm font-semibold text-white leading-snug">
                {action.title}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                {/* Battery icon */}
                <BatteryIcon level={energy.bars} color={energy.color} />
                {/* Energy badge */}
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full border font-semibold tracking-widest uppercase"
                  style={{ borderColor: `${energy.color}40`, color: energy.color, background: `${energy.color}12` }}
                >
                  {action.energy_required}
                </span>
                {/* Timeframe */}
                <span className="text-[10px] text-white/30 font-mono whitespace-nowrap border border-white/[0.07] rounded px-1.5 py-0.5">
                  {action.timeframe}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="ai-text text-sm text-white/55 leading-relaxed mb-2">{action.description}</p>

            {/* Why this matters — slides down on hover */}
            <div
              className="overflow-hidden"
              style={{
                maxHeight: expanded ? '120px' : '0px',
                opacity: expanded ? 1 : 0,
                transition: 'max-height 300ms cubic-bezier(0.16,1,0.3,1), opacity 300ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <div className="border-t border-white/[0.06] pt-3 mt-1">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-[#6366f1]/50 mb-1">
                  Why this matters
                </p>
                <p className="ai-text text-xs text-white/50 leading-relaxed italic">
                  {action.why_this_matters}
                </p>
              </div>
            </div>

            {/* Conflict link */}
            {action.blocks_conflict_id && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-white/30">
                <span>🔗</span>
                <span>Resolves conflict</span>
                <span className="font-mono text-[#6366f1]/60">{action.blocks_conflict_id}</span>
              </div>
            )}
          </div>
        </div>
      </GlowCard>
    </div>
  )
}
