'use client'

import { useEffect, useRef } from 'react'

type CursorMode = 'default' | 'conflict' | 'clarity' | 'chip'

interface NeuralCursorProps {
  mode?: CursorMode
}

export function NeuralCursor({ mode = 'default' }: NeuralCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: -100, y: -100 })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const tick = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform =
          `translate(${posRef.current.x - 15}px, ${posRef.current.y - 15}px)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const outerColor =
    mode === 'conflict' ? '#ef4444' :
    mode === 'clarity'  ? '#10b981' :
    'rgba(255,255,255,0.25)'

  const innerColor =
    mode === 'conflict' ? 'rgba(239,68,68,0.4)' :
    mode === 'clarity'  ? 'rgba(16,185,129,0.4)' :
    'rgba(255,255,255,0.15)'

  const spinStyle: React.CSSProperties = mode === 'chip'
    ? { animation: 'cursorSpin 600ms linear infinite' }
    : {}

  const pulseStyle: React.CSSProperties = mode === 'conflict'
    ? { animation: 'cursorPulse 800ms ease-in-out infinite' }
    : {}

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 30,
        height: 30,
        zIndex: 9999,
        pointerEvents: 'none',
        willChange: 'transform',
        transition: 'opacity 200ms ease',
        ...spinStyle,
        ...pulseStyle,
      }}
    >
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        {/* Inner ring r=7 */}
        <circle
          cx="15" cy="15" r="7"
          stroke={innerColor}
          strokeWidth="1"
          fill="none"
          style={{ transition: 'stroke 200ms ease' }}
        />
        {/* Outer ring r=15 */}
        <circle
          cx="15" cy="15" r="14"
          stroke={outerColor}
          strokeWidth="1"
          fill="none"
          strokeDasharray="4 4"
          style={{ transition: 'stroke 200ms ease' }}
        />
      </svg>
    </div>
  )
}
