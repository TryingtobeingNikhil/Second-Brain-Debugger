'use client'

import { useState, useMemo } from 'react'
import { StageResult } from '@/lib/types/analysis'

interface CognitiveFingerprintProps {
  results: StageResult
  sessionId: string
  visible: boolean
}

const AXES = ['CLARITY', 'CONFLICT', 'URGENCY', 'EMOTIONAL\nLOAD', 'ACTION\nREADY'] as const

function computeMetrics(results: StageResult) {
  const clarity = results.clarity?.clarity
  const conflicts = results.conflicts?.conflicts ?? []
  const thoughts = results.parse?.thoughts ?? []
  const actions = results.actions?.actions ?? []

  const clarityScore = clarity
    ? Math.min((clarity.core_truth?.length ?? 0) / 200, 1)
    : 0

  const conflictScore = Math.min(conflicts.length / 5, 1)

  const urgencyScore =
    thoughts.length > 0
      ? Math.min(
          thoughts.reduce((sum, t) => sum + (t.urgency ?? 0), 0) /
            thoughts.length /
            10,
          1
        )
      : 0

  const nonNeutralEmotions =
    thoughts.length > 0
      ? thoughts.filter(t => t.emotion_hint !== 'neutral').length /
        thoughts.length
      : 0

  const actionReadiness = Math.min(actions.length / 6, 1)

  return [clarityScore, conflictScore, urgencyScore, nonNeutralEmotions, actionReadiness]
}

function polarToCart(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function makePolygonPoints(cx: number, cy: number, maxR: number, values: number[]) {
  const n = values.length
  return values
    .map((v, i) => {
      const angle = (360 / n) * i
      const pt = polarToCart(cx, cy, v * maxR, angle)
      return `${pt.x},${pt.y}`
    })
    .join(' ')
}

function makeGridPoints(cx: number, cy: number, maxR: number, factor: number, n: number) {
  return Array.from({ length: n })
    .map((_, i) => {
      const angle = (360 / n) * i
      const pt = polarToCart(cx, cy, factor * maxR, angle)
      return `${pt.x},${pt.y}`
    })
    .join(' ')
}

export function CognitiveFingerprint({ results, sessionId, visible }: CognitiveFingerprintProps) {
  const [hovered, setHovered] = useState(false)
  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null)

  const metrics = useMemo(() => computeMetrics(results), [results])

  const size = hovered ? 240 : 160
  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 28
  const n = 5

  const filledPoints = makePolygonPoints(cx, cy, maxR, metrics)
  const gridPoints033 = makeGridPoints(cx, cy, maxR, 0.33, n)
  const gridPoints066 = makeGridPoints(cx, cy, maxR, 0.66, n)
  const gridPoints100 = makeGridPoints(cx, cy, maxR, 1.0, n)

  const exactValues = [
    (metrics[0] * 100).toFixed(0) + '%',
    (metrics[1] * 100).toFixed(0) + '%',
    (metrics[2] * 100).toFixed(0) + '%',
    (metrics[3] * 100).toFixed(0) + '%',
    (metrics[4] * 100).toFixed(0) + '%',
  ]

  if (!visible) return null

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: visible ? 1 : 0,
        animation: visible ? 'sectionReveal 600ms 800ms cubic-bezier(0.16,1,0.3,1) both' : 'none',
        userSelect: 'none',
      }}
    >
      {/* Label */}
      <div
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '8px',
          fontWeight: 600,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
          marginBottom: '4px',
        }}
      >
        COGNITIVE FINGERPRINT
      </div>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '7px',
          color: 'rgba(255,255,255,0.15)',
          marginBottom: '8px',
          letterSpacing: '0.05em',
        }}
      >
        SESSION: {sessionId}
      </div>

      {/* SVG Chart */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setHoveredAxis(null) }}
        style={{
          cursor: 'default',
          transition: 'width 400ms cubic-bezier(0.16,1,0.3,1), height 400ms cubic-bezier(0.16,1,0.3,1)',
          width: size,
          height: size,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            transition: 'width 400ms cubic-bezier(0.16,1,0.3,1), height 400ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Grid polygons */}
          {[gridPoints033, gridPoints066, gridPoints100].map((pts, gi) => (
            <polygon
              key={gi}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
          ))}

          {/* Axis lines */}
          {Array.from({ length: n }).map((_, i) => {
            const angle = (360 / n) * i
            const outer = polarToCart(cx, cy, maxR, angle)
            return (
              <line
                key={i}
                x1={cx} y1={cy}
                x2={outer.x} y2={outer.y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.5"
              />
            )
          })}

          {/* Filled data polygon */}
          <polygon
            points={filledPoints}
            fill="rgba(99,102,241,0.12)"
            stroke="#6366f1"
            strokeWidth="1"
            style={{ transition: 'all 400ms cubic-bezier(0.16,1,0.3,1)' }}
          />

          {/* Axis endpoint dots */}
          {metrics.map((v, i) => {
            const angle = (360 / n) * i
            const pt = polarToCart(cx, cy, v * maxR, angle)
            return (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={hoveredAxis === i ? 3 : 2}
                fill="#6366f1"
                opacity={hoveredAxis === i ? 1 : 0.6}
                style={{ transition: 'r 200ms ease, opacity 200ms ease' }}
              />
            )
          })}

          {/* Axis labels */}
          {AXES.map((label, i) => {
            const angle = (360 / n) * i
            const labelR = maxR + 18
            const pt = polarToCart(cx, cy, labelR, angle)
            const lines = label.split('\n')
            return (
              <text
                key={i}
                x={pt.x}
                y={pt.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize={size > 160 ? 8 : 7}
                fill={hoveredAxis === i ? '#6366f1' : 'rgba(255,255,255,0.3)'}
                style={{ transition: 'fill 200ms ease, font-size 400ms ease', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredAxis(i)}
                onMouseLeave={() => setHoveredAxis(null)}
              >
                {lines.map((line, li) => (
                  <tspan key={li} x={pt.x} dy={li === 0 ? '-0.4em' : '1.2em'}>
                    {line}
                  </tspan>
                ))}
              </text>
            )
          })}

          {/* Center dot */}
          <circle cx={cx} cy={cy} r={2} fill="rgba(99,102,241,0.4)" />
        </svg>
      </div>

      {/* Value tooltips on hover */}
      {hovered && hoveredAxis !== null && (
        <div
          style={{
            position: 'absolute',
            bottom: -28,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '9px',
            color: '#6366f1',
            background: 'rgba(10,10,15,0.9)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '4px',
            padding: '2px 8px',
            whiteSpace: 'nowrap',
          }}
        >
          {AXES[hoveredAxis].replace('\n', ' ')}: {exactValues[hoveredAxis]}
        </div>
      )}
    </div>
  )
}
