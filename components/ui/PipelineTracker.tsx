'use client'

import { StageName, StageStatus } from '@/lib/types/analysis'

interface PipelineTrackerProps {
  stages: Partial<Record<StageName, StageStatus>>
  labels: Record<StageName, string>
}

const ALL_STAGES: StageName[] = ['parse', 'structure', 'conflicts', 'clarity', 'actions', 'reflect']

const STAGE_ICONS: Record<StageName, string> = {
  parse:     '⟳',
  structure: '⊞',
  conflicts: '⚡',
  clarity:   '◎',
  actions:   '→',
  reflect:   '∿',
}

const STATUS_DOT: Record<StageStatus, string> = {
  idle:       'bg-white/10',
  processing: 'bg-[#6366f1]',
  done:       'bg-[#10b981]',
  error:      'bg-[#ef4444]',
}

const STATUS_TEXT: Record<StageStatus, string> = {
  idle:       'text-white/20',
  processing: 'text-[#6366f1]',
  done:       'text-[#10b981]/60',
  error:      'text-[#ef4444]',
}

const STATUS_BADGE: Record<StageStatus, { label: string; cls: string }> = {
  idle:       { label: 'idle',       cls: 'bg-white/5 text-white/20 border-white/5' },
  processing: { label: 'processing', cls: 'bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/30' },
  done:       { label: 'done',       cls: 'bg-[#10b981]/10 text-[#10b981]/70 border-[#10b981]/20' },
  error:      { label: 'error',      cls: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30' },
}

// SVG path segments for each connector (between nodes 0-5)
// We render a vertical connector SVG between adjacent nodes
function ConnectorSVG({ active }: { active: boolean }) {
  const connectorPath = 'M 4,0 L 4,28'
  return (
    <svg width="8" height="28" viewBox="0 0 8 28" className="flex-shrink-0 mx-auto">
      {/* Background line */}
      <line x1="4" y1="0" x2="4" y2="28" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {/* Fill line for done */}
      {active && (
        <line
          x1="4" y1="0" x2="4" y2="28"
          stroke="#10b981"
          strokeWidth="1"
          opacity="0.4"
        />
      )}
      {/* Animated dot while processing next */}
      {active && (
        <circle r="2" fill="#6366f1" opacity="0.6">
          <animateMotion dur="1.2s" repeatCount="indefinite" path={connectorPath} />
        </circle>
      )}
    </svg>
  )
}

export function PipelineTracker({ stages, labels }: PipelineTrackerProps) {
  return (
    <div className="pipeline-slide-in rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-5 w-full">
      {/* Mobile: horizontal strip */}
      <div className="pipeline-mobile">
        <p className="text-[9px] font-semibold tracking-widest text-white/25 uppercase mb-3">
          Pipeline
        </p>
        <div className="flex items-center gap-0">
          {ALL_STAGES.map((stage, i) => {
            const status: StageStatus = stages[stage] ?? 'idle'
            const isLast = i === ALL_STAGES.length - 1
            return (
              <div key={stage} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${STATUS_DOT[status]} ${status === 'processing' ? 'ring-2 ring-[#6366f1]/30 scale-125' : ''}`}
                  />
                  <span className={`text-[8px] font-medium text-center leading-tight whitespace-nowrap ${STATUS_TEXT[status]}`}>
                    {labels[stage].split(' ')[0]}
                  </span>
                </div>
                {!isLast && (
                  <div className="flex-1 h-px mx-1 bg-white/[0.06]">
                    {status === 'done' && (
                      <div className="h-full bg-[#10b981]/40 transition-all duration-700 w-full" />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Desktop: vertical list with connectors */}
      <div className="pipeline-desktop">
        <p className="text-[9px] font-semibold tracking-widest text-white/25 uppercase mb-4">
          Analysis Pipeline
        </p>
        <div className="flex flex-col">
          {ALL_STAGES.map((stage, i) => {
            const status: StageStatus = stages[stage] ?? 'idle'
            const badge = STATUS_BADGE[status]
            const isLast = i === ALL_STAGES.length - 1
            const prevStatus = i > 0 ? (stages[ALL_STAGES[i - 1]] ?? 'idle') : 'idle'
            const connectorActive = prevStatus === 'done' || status === 'processing'

            return (
              <div key={stage}>
                {/* Connector between nodes */}
                {i > 0 && (
                  <div className="flex justify-start pl-[9px]">
                    <ConnectorSVG active={connectorActive} />
                  </div>
                )}

                {/* Node row */}
                <div className={`flex items-center gap-3 group transition-opacity duration-300 ${status === 'done' ? 'opacity-60' : 'opacity-100'}`}>
                  {/* Icon dot */}
                  <div className={`relative flex-shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center border transition-all duration-300
                    ${status === 'processing'
                      ? 'border-[#6366f1]/60 bg-[#6366f1]/15 scale-110 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                      : status === 'done'
                      ? 'border-[#10b981]/30 bg-[#10b981]/10'
                      : status === 'error'
                      ? 'border-[#ef4444]/40 bg-[#ef4444]/10'
                      : 'border-white/10 bg-white/[0.03]'
                    }`}
                  >
                    {status === 'done' ? (
                      <span className="text-[#10b981] text-[10px]">✓</span>
                    ) : status === 'error' ? (
                      <span className="text-[#ef4444] text-[10px]">✕</span>
                    ) : (
                      <span className={`text-[9px] ${STATUS_TEXT[status]}`}>{STAGE_ICONS[stage]}</span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-medium transition-colors duration-300 ${STATUS_TEXT[status]}`}>
                      {labels[stage]}
                    </span>
                    <span className={`text-[9px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded border ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
