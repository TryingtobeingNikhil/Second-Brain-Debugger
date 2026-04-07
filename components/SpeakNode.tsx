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
    audio_url?: string
    voice_script?: string
    tone?: string
    pause_after_seconds?: number
  }
  active?: boolean
}

const BAR_COUNT = 20

function Oscilloscope({ playing }: { playing: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 36, marginBottom: 10 }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const period = 0.3 + (i % 5) * 0.08
        const phase = (i / BAR_COUNT) * Math.PI * 2
        return (
          <div key={i} style={{
            flex: 1,
            background: playing ? T.green : 'rgba(0,255,136,0.25)',
            borderRadius: 1,
            minHeight: 2,
            animation: playing ? `oscBar ${period}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${(i * 0.03).toFixed(2)}s`,
            transition: 'background 0.3s',
          }} />
        )
      })}
      <style>{`
        @keyframes oscBar {
          0%   { height: 3px; }
          25%  { height: 12px; }
          50%  { height: 26px; }
          75%  { height: 14px; }
          100% { height: 4px; }
        }
      `}</style>
    </div>
  )
}

export default function SpeakNode({ data, active }: Props) {
  const [playing, setPlaying] = useState(false)
  const [autoPlayed, setAutoPlayed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const confRef = useRef(+(72 + Math.random() * 24).toFixed(1))
  const conf = confRef.current

  // Auto-play once when audio_url arrives
  useEffect(() => {
    if (data?.audio_url && !autoPlayed) {
      setAutoPlayed(true)
      const a = new Audio(data.audio_url)
      audioRef.current = a
      a.onplay = () => setPlaying(true)
      a.onpause = () => setPlaying(false)
      a.onended = () => setPlaying(false)
      a.onerror = () => { setError('Playback error'); setPlaying(false) }
      a.play().catch(() => setError('Autoplay blocked — click PLAY'))
    }
  }, [data?.audio_url, autoPlayed])

  function togglePlay() {
    if (!audioRef.current || !data?.audio_url) return
    if (playing) {
      audioRef.current.pause()
    } else {
      if (!audioRef.current.src) {
        audioRef.current = new Audio(data.audio_url)
        audioRef.current.onplay = () => setPlaying(true)
        audioRef.current.onpause = () => setPlaying(false)
        audioRef.current.onended = () => setPlaying(false)
      }
      audioRef.current.play().catch(() => setError('Playback failed'))
    }
  }

  const border = active ? `1px solid ${T.green}` : `1px dashed rgba(255,255,255,0.06)`
  const shadow = active ? `0 0 20px rgba(0,255,136,0.12)` : 'none'

  const toneColor: Record<string, string> = {
    direct: T.amber, confrontational: T.red,
    gentle: T.green, analytical: '#4499ff',
  }

  return (
    <div style={{ position: 'absolute', top: '62%', left: '67%', width: 240, zIndex: 10 }}>
      <div style={{ fontSize: 9, color: 'rgba(0,255,136,0.18)', letterSpacing: '0.12em', fontFamily: T.mono, marginBottom: 4 }}>[HIDDEN_L3]</div>
      <div style={{ background: T.surface, border, borderRadius: 4, padding: '14px 16px', boxShadow: shadow, transition: 'all 0.4s ease', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ fontSize: 9, color: 'rgba(0,255,136,0.5)', fontFamily: T.mono, letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          [AUDIO_SYNTHESIS]
        </div>

        {/* Content */}
        {data ? (
          <div>
            <Oscilloscope playing={playing} />

            {data.voice_script && (
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textSecondary, lineHeight: 1.6, marginBottom: 8, wordBreak: 'break-word', borderLeft: '2px solid rgba(0,255,136,0.2)', paddingLeft: 8 }}>
                {data.voice_script}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              {data.tone && (
                <span style={{ fontFamily: T.mono, fontSize: 9, color: toneColor[data.tone] ?? T.green, border: `1px dashed ${toneColor[data.tone] ?? T.green}`, padding: '2px 6px', borderRadius: 2 }}>
                  {data.tone.toUpperCase()}
                </span>
              )}
              {data.pause_after_seconds != null && (
                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.textSecondary }}>
                  pause: {data.pause_after_seconds}s
                </span>
              )}
            </div>

            {data.audio_url ? (
              <button onClick={togglePlay} style={{
                width: '100%',
                background: playing ? 'rgba(0,255,136,0.08)' : 'transparent',
                border: `1px dashed ${T.green}`,
                color: T.green,
                fontFamily: T.mono, fontSize: 11,
                padding: '6px 0', cursor: 'pointer',
                borderRadius: 2, transition: 'all 0.2s',
                letterSpacing: '0.08em',
              }}>
                {playing ? '[ || PAUSE ]' : '[ ▸ PLAY ]'}
              </button>
            ) : (
              <div style={{ fontFamily: T.mono, fontSize: 9, color: 'rgba(0,255,136,0.4)', animation: 'speakPulse 1.4s ease-in-out infinite' }}>
                SYNTHESIZING AUDIO...
              </div>
            )}
            {error && <div style={{ fontFamily: T.mono, fontSize: 9, color: T.red, marginTop: 4 }}>{error}</div>}
          </div>
        ) : active ? (
          <div style={{ fontFamily: T.mono, fontSize: 9, color: 'rgba(0,255,136,0.4)', animation: 'speakPulse 1.4s ease-in-out infinite' }}>
            SYNTHESIZING AUDIO...
          </div>
        ) : (
          <div style={{ color: T.textTertiary, fontFamily: T.mono, fontSize: 10 }}>Awaiting clarity signal...</div>
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
      <style>{`
        @keyframes speakPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
