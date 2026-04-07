'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

const T = {
  green: '#00ff88',
  red: '#ff3333',
  mono: 'JetBrains Mono, monospace',
}

interface Props {
  onTranscript: (text: string) => void
  disabled: boolean
}

export default function MicButton({ onTranscript, disabled }: Props) {
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setLoading(true)
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const fd = new FormData()
          fd.append('audio', blob, 'recording.webm')
          const res = await fetch('/api/multimodal/transcribe', { method: 'POST', body: fd })
          const data = await res.json()
          if (data.transcript) onTranscript(data.transcript)
          else setError(data.error || 'Transcription failed')
        } catch { setError('Network error') }
        finally { setLoading(false) }
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
    } catch { setError('Mic access denied') }
  }, [onTranscript])

  const stopRecording = useCallback(() => {
    mediaRef.current?.stop()
    setRecording(false)
  }, [])

  useEffect(() => () => { mediaRef.current?.stop() }, [])

  const barCount = 12
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Waveform bars */}
      {recording && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 24 }}>
          {Array.from({ length: barCount }).map((_, i) => (
            <div key={i} style={{
              width: 3,
              background: T.red,
              borderRadius: 1,
              animation: `waveBar ${0.4 + (i % 4) * 0.12}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.05}s`,
            }} />
          ))}
        </div>
      )}
      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled || loading}
        title={recording ? 'Stop recording' : 'Start voice input'}
        style={{
          position: 'relative',
          width: 32, height: 32,
          borderRadius: '50%',
          border: `1px solid ${recording ? T.red : 'rgba(0,255,136,0.35)'}`,
          background: recording ? 'rgba(255,51,51,0.12)' : 'transparent',
          color: recording ? T.red : T.green,
          fontFamily: T.mono,
          fontSize: 14,
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        {loading ? '…' : recording ? '■' : '⏺'}
        {recording && (
          <span style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: `2px solid ${T.red}`,
            animation: 'micPulse 1s ease-out infinite',
            pointerEvents: 'none',
          }} />
        )}
      </button>
      {error && (
        <span style={{ fontFamily: T.mono, fontSize: 9, color: T.red }}>{error}</span>
      )}
      <style>{`
        @keyframes micPulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes waveBar {
          from { height: 4px; }
          to   { height: 20px; }
        }
      `}</style>
    </div>
  )
}
