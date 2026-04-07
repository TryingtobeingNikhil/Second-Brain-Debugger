'use client'

import { StageName, StageStatus } from '@/lib/types/analysis'
import { useEffect, useRef, useState } from 'react'

interface PipelineTrackerProps {
  stages: Partial<Record<StageName, StageStatus>>
  labels: Record<StageName, string>
}

const ALL_STAGES: StageName[] = ['parse', 'structure', 'conflicts', 'clarity', 'actions', 'reflect']

const STAGE_ICONS: Partial<Record<StageName, string>> = {
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

// ── Thinking Log ──────────────────────────────────────────────────────────────

const LOG_POOL = [
  '[LOG] Scanning for cognitive dissonance...',
  '[LOG] Mapping emotional weight to clusters...',
  '[LOG] Threshold exceeded — retrying parse...',
  '[WARN] Ambiguity detected in conflict vector...',
  '[ERR] Retrying schema validation...',
  '[LOG] Calculating latent space distance...',
]

function makeLogLine(random: () => number) {
  const templates = [
    () => LOG_POOL[Math.floor(random() * LOG_POOL.length)],
    () => `[LOG] Resolving ambiguity in Node_0${Math.floor(random() * 9)}...`,
    () => `[LOG] Linking ActionStep to ConflictCard_0${Math.floor(random() * 9)}...`,
    () => `[LOG] Synapse map: ${Math.floor(random() * 40 + 60)} nodes resolved...`,
    () => {
      const emotions = ['guilt', 'longing', 'resistance', 'hope', 'shame', 'drive']
      return `[LOG] Emotional signature: ${emotions[Math.floor(random() * emotions.length)]}`
    },
  ]
  return templates[Math.floor(random() * templates.length)]()
}

interface ThinkingLogProps {
  active: boolean
}

function ThinkingLog({ active }: ThinkingLogProps) {
  const [lines, setLines] = useState<Array<{ text: string; key: number; visible: boolean }>>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const keyRef = useRef(0)
  // Seeded-ish random via ref so it's stable
  const seedRef = useRef(Math.random())
  const rng = () => {
    seedRef.current = (seedRef.current * 9301 + 49297) % 233280
    return seedRef.current / 233280
  }

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setLines([])
      return
    }

    const addLine = () => {
      const text = makeLogLine(rng)
      const key = keyRef.current++
      setLines(prev => {
        const next = [...prev, { text, key, visible: false }]
        return next.slice(-4) // keep max 4
      })
      // Trigger visible after a frame
      setTimeout(() => {
        setLines(prev =>
          prev.map(l => (l.key === key ? { ...l, visible: true } : l))
        )
      }, 16)
    }

    addLine()
    intervalRef.current = setInterval(addLine, 800)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [active])

  if (!active || lines.length === 0) return null

  return (
    <div
      style={{
        marginTop: '8px',
        marginLeft: '36px',
        overflow: 'hidden',
        maxHeight: '64px',
      }}
    >
      {lines.map(line => (
        <div
          key={line.key}
          title={line.text}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            color: '#94a3b8',
            opacity: line.visible ? 0.5 : 0,
            transition: 'opacity 300ms ease',
            lineHeight: '1.4',
            width: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {line.text}
        </div>
      ))}
    </div>
  )
}

// ── Glitch transition on done ─────────────────────────────────────────────────

const GLITCH_CHARS = ['█', '▓', '▒', '░', '✓']

function GlitchCheckmark() {
  const [frame, setFrame] = useState(0)
  const doneRef = useRef(false)

  useEffect(() => {
    if (doneRef.current) return
    doneRef.current = true
    let f = 0
    const iv = setInterval(() => {
      f++
      setFrame(f)
      if (f >= GLITCH_CHARS.length - 1) clearInterval(iv)
    }, 40)
    return () => clearInterval(iv)
  }, [])

  return (
    <span
      className="text-[#10b981] text-[10px]"
      style={{ fontFamily: 'JetBrains Mono, monospace' }}
    >
      {GLITCH_CHARS[Math.min(frame, GLITCH_CHARS.length - 1)]}
    </span>
  )
}

// ── Connector SVG ─────────────────────────────────────────────────────────────

function ConnectorSVG({ active }: { active: boolean }) {
  const connectorPath = 'M 4,0 L 4,28'
  return (
    <svg width="8" height="28" viewBox="0 0 8 28" className="flex-shrink-0 mx-auto">
      <line x1="4" y1="0" x2="4" y2="28" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {active && (
        <line
          x1="4" y1="0" x2="4" y2="28"
          stroke="#10b981"
          strokeWidth="1"
          opacity="0.4"
        />
      )}
      {active && (
        <circle r="2" fill="#6366f1" opacity="0.6">
          <animateMotion dur="1.2s" repeatCount="indefinite" path={connectorPath} />
        </circle>
      )}
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PipelineTracker({ stages, labels }: PipelineTrackerProps) {
  // Track which stages just transitioned to done (for glitch effect)
  const prevStagesRef = useRef<Partial<Record<StageName, StageStatus>>>({})
  const [glitching, setGlitching] = useState<Set<StageName>>(new Set())

  useEffect(() => {
    const prev = prevStagesRef.current
    const newGlitch = new Set<StageName>()
    ALL_STAGES.forEach(stage => {
      if (prev[stage] === 'processing' && stages[stage] === 'done') {
        newGlitch.add(stage)
      }
    })
    if (newGlitch.size > 0) {
      setGlitching(prev => new Set([...Array.from(prev), ...Array.from(newGlitch)]))
      // After glitch animation (~200ms), clear
      setTimeout(() => {
        setGlitching(prev => {
          const next = new Set(Array.from(prev))
          Array.from(newGlitch).forEach(s => next.delete(s))
          return next
        })
      }, 250)
    }
    prevStagesRef.current = { ...stages }
  }, [stages])

  // Find the currently active (processing) stage for the thinking log
  const processingStage = ALL_STAGES.find(s => stages[s] === 'processing')

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
            const isGlitching = glitching.has(stage)
            const isProcessing = status === 'processing'

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
                      isGlitching ? <GlitchCheckmark /> : <span className="text-[#10b981] text-[10px]">✓</span>
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

                {/* Thinking log — only below the currently processing stage */}
                {isProcessing && (
                  <ThinkingLog active={true} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
