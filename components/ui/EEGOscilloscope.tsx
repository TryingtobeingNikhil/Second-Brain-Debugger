'use client'

import { useEffect, useRef } from 'react'

interface EEGOsciloscopeProps {
  flatline?: boolean
  spike?: boolean
}

export function EEGOscilloscope({ flatline = false, spike = false }: EEGOsciloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const startRef = useRef<number>(Date.now())
  const spikeRef = useRef(false)
  const spikeMsRef = useRef(0)

  useEffect(() => {
    if (spike) {
      spikeRef.current = true
      spikeMsRef.current = Date.now()
      setTimeout(() => { spikeRef.current = false }, 300)
    }
  }, [spike])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 220
    const H = 28
    const CY = H / 2

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      const now = Date.now()
      const t = (now - startRef.current) / 1000

      const spikeActive = spikeRef.current
      const spikeAmp = spikeActive ? 14 : 0

      const ampA = flatline ? 0 : 5
      const ampB = flatline ? 0 : 3

      // Wave A — indigo, 0.8Hz
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(99,102,241,0.5)'
      ctx.lineWidth = 1.2
      for (let x = 0; x < W; x++) {
        const phase = (x / W) * Math.PI * 2
        const y = CY + Math.sin(phase - t * 0.8 * Math.PI * 2) * (ampA + spikeAmp)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Wave B — green, 1.8Hz
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(16,185,129,0.35)'
      ctx.lineWidth = 1
      for (let x = 0; x < W; x++) {
        const phase = (x / W) * Math.PI * 2
        const y = CY + Math.sin(phase - t * 1.8 * Math.PI * 2) * (ampB + spikeAmp * 0.6)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [flatline])

  return (
    <canvas
      ref={canvasRef}
      width={220}
      height={28}
      style={{ display: 'block', margin: '6px auto 0', opacity: 0.7 }}
    />
  )
}
