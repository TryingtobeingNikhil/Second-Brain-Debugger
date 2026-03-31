'use client'

import { useEffect, useState, useRef } from 'react'

interface TypewriterProps {
  text: string
  speed?: number
  onComplete?: () => void
  pauseOnPunctuation?: boolean
  className?: string
  cursorClass?: string
}

const EMOTIONAL_KEYWORDS = new Set([
  'anxiety', 'fear', 'avoidance', 'breakthrough', 'core',
  'truth', 'want', 'need', 'avoid', 'conflict', 'identity',
  'clarity', 'trapped', 'freedom', 'failure', 'success',
])

const COMMON_WORDS = new Set([
  'the', 'is', 'and', 'of', 'to', 'a', 'in', 'that', 'it', 'you',
])

const PUNCTUATION_SET = new Set(['.', ',', ';', ':', '!', '?'])
const PUNCTUATION_PAUSE_MS = 300

function tokenize(text: string) {
  return text.match(/\S+|\s+/g) ?? []
}

export function Typewriter({
  text,
  speed = 25,
  onComplete,
  pauseOnPunctuation = true,
  className = '',
  cursorClass = 'typewriter-cursor',
}: TypewriterProps) {
  const [segments, setSegments] = useState<Array<{ text: string; flash: boolean }>>([])
  const [done, setDone] = useState(false)
  const onCompleteRef = useRef(onComplete)
  // Single-invocation guard — survives StrictMode double-mount
  const started = useRef(false)
  const hasCalledComplete = useRef(false)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    // Reset guard on text change so a new run can start
    started.current = false
  }, [text])

  useEffect(() => {
    if (started.current) return
    started.current = true

    let cancelled = false

    setSegments([])
    setDone(false)
    hasCalledComplete.current = false

    if (!text) {
      started.current = false
      return
    }

    const tokens = tokenize(text)

    const delayMs = (ms: number) =>
      new Promise<void>((res) => setTimeout(res, ms))

    const run = async () => {
      for (const token of tokens) {
        if (cancelled) return

        const word = token.trim().toLowerCase().replace(/[^a-z]/g, '')
        const isWhitespace = token.trim() === ''

        if (isWhitespace) {
          for (const ch of token) {
            if (cancelled) return
            setSegments(prev => {
              const last = prev[prev.length - 1]
              if (last && !last.flash) {
                return [...prev.slice(0, -1), { text: last.text + ch, flash: false }]
              }
              return [...prev, { text: ch, flash: false }]
            })
            await delayMs(4)
          }
          continue
        }

        const isEmotional = EMOTIONAL_KEYWORDS.has(word)
        const isCommon = COMMON_WORDS.has(word)
        const msPerChar = isCommon ? 8 : isEmotional ? 35 : 22

        if (isEmotional) {
          await delayMs(400)
          if (cancelled) return
        }

        for (const ch of token) {
          if (cancelled) return

          if (PUNCTUATION_SET.has(ch) && pauseOnPunctuation) {
            setSegments(prev => {
              const last = prev[prev.length - 1]
              if (last && !last.flash) {
                return [...prev.slice(0, -1), { text: last.text + ch, flash: false }]
              }
              return [...prev, { text: ch, flash: false }]
            })
            await delayMs(PUNCTUATION_PAUSE_MS)
          } else {
            setSegments(prev => {
              const last = prev[prev.length - 1]
              if (last && !last.flash) {
                return [...prev.slice(0, -1), { text: last.text + ch, flash: false }]
              }
              return [...prev, { text: ch, flash: false }]
            })
            await delayMs(msPerChar)
          }
        }
        if (cancelled) return

        if (isEmotional) {
          setSegments(prev => {
            if (prev.length === 0) return prev
            return [...prev.slice(0, -1), { text: prev[prev.length - 1].text, flash: true }]
          })
          await delayMs(400)
          if (cancelled) return
          setSegments(prev => {
            if (prev.length === 0) return prev
            return [...prev.slice(0, -1), { text: prev[prev.length - 1].text, flash: false }]
          })
          await delayMs(200)
          if (cancelled) return
        }
      }

      if (!cancelled) {
        setDone(true)
        if (!hasCalledComplete.current) {
          hasCalledComplete.current = true
          onCompleteRef.current?.()
        }
      }

      started.current = false
    }

    run()

    return () => {
      cancelled = true
      started.current = false
    }
  }, [text, speed, pauseOnPunctuation])

  return (
    <span className={className}>
      {segments.map((seg, i) => (
        <span
          key={i}
          style={
            seg.flash
              ? { borderBottom: '1px solid #ef4444', transition: 'border-color 200ms ease' }
              : undefined
          }
        >
          {seg.text}
        </span>
      ))}
      {!done && <span className={cursorClass} aria-hidden="true" />}
    </span>
  )
}
