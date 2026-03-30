'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface TypewriterProps {
  text: string
  speed?: number
  onComplete?: () => void
  pauseOnPunctuation?: boolean
  className?: string
  cursorClass?: string
}

const PUNCTUATION_PAUSE_MS = 300
const PUNCTUATION_SET = new Set(['.', ',', ';', ':', '!', '?'])

export function Typewriter({
  text,
  speed = 25,
  onComplete,
  pauseOnPunctuation = true,
  className = '',
  cursorClass = 'typewriter-cursor',
}: TypewriterProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const onCompleteRef = useRef(onComplete)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const iRef = useRef(0)
  const hasCalledComplete = useRef(false)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    iRef.current = 0
    hasCalledComplete.current = false
    clearTimer()

    if (!text) return

    const tick = () => {
      const i = iRef.current
      if (i >= text.length) {
        setDone(true)
        if (!hasCalledComplete.current) {
          hasCalledComplete.current = true
          onCompleteRef.current?.()
        }
        return
      }

      const char = text[i]
      setDisplayed(text.slice(0, i + 1))
      iRef.current = i + 1

      const isPunct = pauseOnPunctuation && PUNCTUATION_SET.has(char)
      const delay = isPunct ? PUNCTUATION_PAUSE_MS : speed

      timeoutRef.current = setTimeout(tick, delay)
    }

    timeoutRef.current = setTimeout(tick, speed)
    return clearTimer
  }, [text, speed, pauseOnPunctuation, clearTimer])

  return (
    <span className={className}>
      {displayed}
      {!done && <span className={cursorClass} aria-hidden="true" />}
    </span>
  )
}
