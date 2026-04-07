'use client'
import { useState, useRef, useEffect } from 'react'

const T = {
  green: '#00ff88',
  red: '#ff3333',
  amber: '#ffaa00',
  surface: '#111111',
  textPrimary: '#f0f0f0',
  textSecondary: '#888888',
  textTertiary: '#444444',
  mono: 'JetBrains Mono, monospace',
}

interface Props {
  data?: {
    image_url?: string | null
    sd_prompt?: string
    dominant_metaphor?: string
    emotional_temperature?: string
  }
  active?: boolean
}

const GRID = 8
const CELL = 10

function PixelLoader() {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 9, color: 'rgba(0,255,136,0.4)', fontFamily: T.mono, marginBottom: 6, letterSpacing: '0.1em' }}>
        SAMPLING LATENT SPACE<span style={{ animation: 'dots 1.5s steps(3,end) infinite' }}>...</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, ${CELL}px)`, gap: 2 }}>
        {Array.from({ length: GRID * GRID }).map((_, i) => (
          <div key={i} style={{
            width: CELL, height: CELL,
            background: 'rgba(0,255,136,0.15)',
            borderRadius: 1,
            animation: `pixelBlink ${0.6 + Math.random() * 0.8}s ease-in-out infinite alternate`,
            animationDelay: `${(i * 37) % 900}ms`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pixelBlink {
          from { background: rgba(0,255,136,0.05); }
          to   { background: rgba(0,255,136,0.45); }
        }
        @keyframes dots {
          0%   { content: '.'; }
          33%  { content: '..'; }
          66%  { content: '...'; }
        }
      `}</style>
    </div>
  )
}

function TypewriterSampling({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    let i = 0
    const iv = setInterval(() => {
      if (i >= text.length) { clearInterval(iv); return }
      setDisplayed(prev => prev + text[i++])
    }, 28)
    return () => clearInterval(iv)
  }, [text])
  return (
    <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textSecondary, lineHeight: 1.6, wordBreak: 'break-word' }}>
      {displayed}
      <span style={{ display: 'inline-block', width: 2, height: '1em', background: T.green, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />
    </div>
  )
}

export default function ImagineNode({ data, active }: Props) {
  const confRef = useRef(+(72 + Math.random() * 24).toFixed(1))
  const conf = confRef.current

  const border = active
    ? `1px solid ${T.green}`
    : `1px dashed rgba(255,255,255,0.06)`
  const shadow = active ? `0 0 20px rgba(0,255,136,0.12)` : 'none'

  const tempColor: Record<string, string> = {
    cold: '#4488ff', volatile: T.red, fragmented: T.amber,
    heavy: '#aa44ff', electric: T.green,
  }

  return (
    <div style={{ position: 'absolute', top: '28%', left: '67%', width: 240, zIndex: 10 }}>
      <div style={{ fontSize: 9, color: 'rgba(0,255,136,0.18)', letterSpacing: '0.12em', fontFamily: T.mono, marginBottom: 4 }}>[HIDDEN_L3]</div>
      <div style={{ background: T.surface, border, borderRadius: 4, padding: '14px 16px', boxShadow: shadow, transition: 'all 0.4s ease', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ fontSize: 9, color: 'rgba(0,255,136,0.5)', fontFamily: T.mono, letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          [LATENT_SPACE_OUTPUT]
        </div>

        {/* Content */}
        {data?.image_url ? (
          <div>
            <img
              src={data.image_url}
              alt="Cognitive visualization"
              style={{
                width: '100%', height: 160, objectFit: 'cover',
                borderRadius: 2, border: '1px dashed rgba(0,255,136,0.2)',
                display: 'block', marginBottom: 8,
                imageRendering: 'pixelated',
              }}
            />
            {data.dominant_metaphor && (
              <div style={{ fontFamily: T.mono, fontSize: 9, color: 'rgba(0,255,136,0.5)', marginBottom: 4 }}>
                METAPHOR: {data.dominant_metaphor.toUpperCase()}
              </div>
            )}
            {data.emotional_temperature && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: tempColor[data.emotional_temperature] ?? T.green }} />
                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.textSecondary }}>
                  {data.emotional_temperature.toUpperCase()}
                </span>
              </div>
            )}
            {data.sd_prompt && <TypewriterSampling text={data.sd_prompt.slice(0, 80)} />}
          </div>
        ) : active ? (
          <PixelLoader />
        ) : (
          <div style={{ color: T.textTertiary, fontFamily: T.mono, fontSize: 10 }}>Awaiting conflict data...</div>
        )}

        {/* Confidence bar */}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 8, color: active ? 'rgba(0,255,136,0.7)' : 'rgba(0,255,136,0.35)', fontFamily: T.mono, marginBottom: 3 }} suppressHydrationWarning>
            CONFIDENCE: {conf}%
          </div>
          <div style={{ height: 1.5, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
            <div style={{ height: '100%', width: active ? `${conf}%` : '0%', background: T.green, borderRadius: 1, transition: 'width 800ms ease-out' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
