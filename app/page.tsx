'use client'

import {
  useState, useRef, useEffect, useCallback, useReducer
} from 'react'
import { PipelineTracker } from '@/components/ui/PipelineTracker'
import { ThoughtChip } from '@/components/ui/ThoughtChip'
import { ConflictCard } from '@/components/ui/ConflictCard'
import { ClarityCard } from '@/components/ui/ClarityCard'
import { ActionStep } from '@/components/ui/ActionStep'
import { QuestionCard } from '@/components/ui/QuestionCard'
import { Shimmer } from '@/components/ui/Shimmer'
import {
  HistoryDrawer, saveToHistory, loadHistory, type HistoryEntry
} from '@/components/ui/HistoryDrawer'
import {
  StageResult, StageName, StageStatus, StreamEvent, Category
} from '@/lib/types/analysis'

// ─── Constants ──────────────────────────────────────────────────────────────

const STAGE_ORDER: StageName[] = [
  'parse', 'structure', 'conflicts', 'clarity', 'actions', 'reflect',
]

const STAGE_LABELS: Record<StageName, string> = {
  parse:     'Parsing thoughts',
  structure: 'Structuring ideas',
  conflicts: 'Detecting conflicts',
  clarity:   'Generating clarity',
  actions:   'Building action plan',
  reflect:   'Reflecting deeply',
}

const delay = (ms: number) => new Promise<void>(res => setTimeout(res, ms))

// ─── Markdown export ────────────────────────────────────────────────────────

function exportMarkdown(input: string, results: StageResult): string {
  const lines: string[] = [
    '# Second Brain Debug Session',
    `> ${new Date().toLocaleString()}`,
    '',
    '## Your Thoughts',
    '```',
    input,
    '```',
    '',
  ]

  if (results.parse) {
    lines.push('## Atomic Thoughts')
    results.parse.thoughts.forEach(t => {
      lines.push(`- **[${t.emotion_hint}]** (urgency ${t.urgency}/10) ${t.raw}`)
    })
    lines.push('')
  }

  if (results.structure) {
    lines.push('## Mental Structure')
    results.structure.categories.forEach(c => {
      lines.push(`### ${c.name} (${c.weight_percentage}%)`)
    })
    lines.push('')
  }

  if (results.conflicts) {
    lines.push('## Internal Conflicts')
    results.conflicts.conflicts.forEach(c => {
      lines.push(`### ⚡ ${c.conflict_type} (severity ${c.severity}/10)`)
      lines.push(c.description)
      lines.push(`> **Hint:** ${c.resolution_hint}`)
      lines.push('')
    })
  }

  if (results.clarity) {
    const cl = results.clarity.clarity
    lines.push('## Core Clarity')
    lines.push(`**Core Truth:** ${cl.core_truth}`)
    lines.push(`**Underlying Need:** ${cl.underlying_need}`)
    lines.push(`**What You're Avoiding:** ${cl.what_youre_avoiding}`)
    lines.push('')
  }

  if (results.actions) {
    lines.push('## Action Plan')
    results.actions.actions.forEach(a => {
      lines.push(`${a.step_number}. **${a.title}** *(${a.timeframe}, ${a.energy_required} energy)*`)
      lines.push(`   ${a.description}`)
    })
    lines.push('')
  }

  if (results.reflect) {
    lines.push('## Questions to Sit With')
    results.reflect.questions.forEach(q => {
      lines.push(`- [${q.depth_level}] ${q.question}`)
    })
    lines.push('')
  }

  return lines.join('\n')
}

// ─── Category connections SVG ────────────────────────────────────────────────

function CategoryConnectionsOverlay({
  chipRefs, activeCategoryThoughts,
}: {
  chipRefs: React.MutableRefObject<Map<string, HTMLElement | null>>
  activeCategoryThoughts: string[]
}) {
  const [lines, setLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number; key: string }>>([])
  const containerRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!activeCategoryThoughts.length) { setLines([]); return }

    const svgEl = containerRef.current
    if (!svgEl) return
    const rect = svgEl.getBoundingClientRect()

    const pts = activeCategoryThoughts
      .map(id => {
        const el = chipRefs.current.get(id)
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: r.left + r.width / 2 - rect.left, y: r.top + r.height / 2 - rect.top, id }
      })
      .filter(Boolean) as Array<{ x: number; y: number; id: string }>

    const newLines: typeof lines = []
    for (let i = 0; i < pts.length - 1; i++) {
      newLines.push({
        x1: pts[i].x, y1: pts[i].y,
        x2: pts[i + 1].x, y2: pts[i + 1].y,
        key: `${pts[i].id}-${pts[i + 1].id}`,
      })
    }
    setLines(newLines)
  }, [activeCategoryThoughts, chipRefs])

  if (!lines.length) return null

  return (
    <svg
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: '100%', height: '100%' }}
    >
      {lines.map(l => (
        <line
          key={l.key}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="#6366f1"
          strokeWidth="1.5"
          opacity="0.25"
          strokeDasharray="4 4"
          className="connection-line"
        />
      ))}
    </svg>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Home() {
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [stages, setStages] = useState<Partial<Record<StageName, StageStatus>>>({})
  const [results, setResults] = useState<StageResult>({})
  const [error, setError] = useState<string | null>(null)

  // UI phases
  const [phase, setPhase] = useState<'idle' | 'processing' | 'done' | 'resetting'>('idle')
  const [terminalLines, setTerminalLines] = useState<string[]>([])
  const [terminalVisible, setTerminalVisible] = useState(false)
  const [inputCollapsed, setInputCollapsed] = useState(false)
  const [pipelineVisible, setPipelineVisible] = useState(false)
  const [dimBg, setDimBg] = useState(false)

  // Visible sections (progressive reveal)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())

  // Saved badge
  const [savedVisible, setSavedVisible] = useState(false)

  // History
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [historyTriggerVisible, setHistoryTriggerVisible] = useState(false)

  // Category filtering
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const chipRefs = useRef<Map<string, HTMLElement | null>>(new Map())
  const [activeCategoryThoughts, setActiveCategoryThoughts] = useState<string[]>([])

  // All sections collapsed (Cmd+K)
  const [allCollapsed, setAllCollapsed] = useState(false)

  // Refs
  const abortRef = useRef<AbortController | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<string, HTMLElement | null>>(new Map())

  // Load history on mount
  useEffect(() => {
    setHistoryEntries(loadHistory())
  }, [])

  // Cmd+K: collapse/expand all sections
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setAllCollapsed(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Auto-scroll to new section
  const scrollToSection = useCallback((key: string) => {
    const el = sectionRefs.current.get(key)
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [])

  const revealSection = useCallback(async (key: string) => {
    setVisibleSections(prev => new Set([...prev, key]))
    await delay(400)
    scrollToSection(key)
  }, [scrollToSection])

  const pushTerminal = useCallback((line: string) => {
    setTerminalLines(prev => [...prev.slice(-30), line])
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight
      }
    }, 50)
  }, [])

  // ─── Run stage ──────────────────────────────────────────────────────────────

  async function runStage(
    stage: StageName,
    inputText: string,
    previousStages: StageResult
  ): Promise<unknown> {
    setStages(s => ({ ...s, [stage]: 'processing' }))
    pushTerminal(`> [${stage}] starting…`)

    const res = await fetch(`/api/analyze/${stage}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: inputText, previousStages }),
      signal: abortRef.current?.signal,
    })

    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({ error: `Stage ${stage} failed` }))
      throw new Error(err.error || `Stage ${stage} failed with status ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let stageData: unknown = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const chunks = buffer.split('\n\n')
      buffer = chunks.pop() ?? ''

      for (const chunk of chunks) {
        if (!chunk.startsWith('data: ')) continue
        try {
          const event: StreamEvent = JSON.parse(chunk.slice(6))
          if (event.type === 'partial' && event.message) {
            pushTerminal(`  ${event.message}`)
          }
          if (event.type === 'stage_complete') {
            stageData = event.data
            pushTerminal(`✓ [${stage}] complete`)
          }
          if (event.type === 'error') {
            throw new Error(event.message ?? `Stage ${stage} error`)
          }
        } catch (parseErr) {
          // Graceful: ignore partial JSON mid-stream
        }
      }
    }

    setStages(s => ({ ...s, [stage]: 'done' }))
    return stageData
  }

  // ─── Master run ─────────────────────────────────────────────────────────────

  async function handleRun() {
    if (!input.trim() || running) return

    setRunning(true)
    setError(null)
    setResults({})
    setStages({})
    setVisibleSections(new Set())
    setActiveCategory(null)
    setActiveCategoryThoughts([])
    setSavedVisible(false)
    setHistoryTriggerVisible(false)
    setPhase('processing')
    abortRef.current = new AbortController()

    // Step 1–2: anticipation delay
    await delay(800)

    // Step 3: textarea collapses
    setInputCollapsed(true)

    await delay(300)

    // Step 4: Pipeline slides in
    setPipelineVisible(true)

    await delay(200)

    // Step 5: Terminal appears
    setTerminalLines(['> Second Brain Debugger v2'])
    setTerminalVisible(true)
    await delay(300)
    pushTerminal('> Initializing analysis pipeline…')
    await delay(400)

    const accumulated: StageResult = {}

    try {
      for (const stage of STAGE_ORDER) {
        // Step 6: Stream stage output
        const data = await runStage(stage, input, { ...accumulated })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(accumulated as any)[stage] = data
        setResults({ ...accumulated })

        // Progressive section reveals
        if (stage === 'parse') {
          await revealSection('thoughts')
        }
        if (stage === 'structure') {
          await revealSection('categories')
        }
        if (stage === 'conflicts') {
          await revealSection('conflicts')
          // Step 8: tension pause after conflicts
          pushTerminal('  ·')
          await delay(900)
        }
        if (stage === 'clarity') {
          // Step 9–10: clarity stage
          pushTerminal('> Extracting core truth…')
          await revealSection('clarity')
        }
        if (stage === 'actions') {
          // Step 12–13: actions reveal
          await delay(400)
          await revealSection('actions')
        }
        if (stage === 'reflect') {
          // Step 14: questions reveal
          await revealSection('questions')
        }
      }

      // Step 15–17: wrap-up
      await delay(600)
      pushTerminal('> All stages complete. Session saved.')
      setPhase('done')

      // Save to history
      const entry = saveToHistory(input, accumulated)
      setHistoryEntries(loadHistory())
      setSavedVisible(true)

      await delay(400)
      setHistoryTriggerVisible(true)

    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const msg = err instanceof Error ? err.message : 'Something went wrong'
        setError(msg)
        pushTerminal(`✕ Error: ${msg}`)
        STAGE_ORDER.forEach(s => {
          setStages(prev => {
            if (prev[s] === 'processing') return { ...prev, [s]: 'error' }
            return prev
          })
        })
      }
    } finally {
      setRunning(false)
    }
  }

  // ─── Reset ──────────────────────────────────────────────────────────────────

  async function handleReset() {
    await delay(400)
    pushTerminal('> session cleared')
    setPhase('resetting')
    await delay(600)

    setInput('')
    setResults({})
    setStages({})
    setError(null)
    setVisibleSections(new Set())
    setActiveCategory(null)
    setActiveCategoryThoughts([])
    setSavedVisible(false)
    setHistoryTriggerVisible(false)
    setInputCollapsed(false)
    setPipelineVisible(false)
    setTerminalVisible(false)
    setTerminalLines([])
    setPhase('idle')
  }

  function handleStop() {
    abortRef.current?.abort()
    setRunning(false)
    setPhase('done')
    pushTerminal('> Analysis stopped.')
  }

  // ─── Category click ──────────────────────────────────────────────────────────

  function handleCategoryClick(cat: Category) {
    if (activeCategory === cat.name) {
      setActiveCategory(null)
      setActiveCategoryThoughts([])
    } else {
      setActiveCategory(cat.name)
      setActiveCategoryThoughts(cat.thoughts)
    }
  }

  // ─── Load history entry ──────────────────────────────────────────────────────

  function handleHistorySelect(entry: HistoryEntry) {
    setResults(entry.result)
    setInput(entry.input_preview)
    setPhase('done')
    setInputCollapsed(false)
    setPipelineVisible(false)
    setTerminalVisible(false)

    // Reveal all sections that have data
    const sects = new Set<string>()
    if (entry.result.parse) sects.add('thoughts')
    if (entry.result.structure) sects.add('categories')
    if (entry.result.conflicts) sects.add('conflicts')
    if (entry.result.clarity) sects.add('clarity')
    if (entry.result.actions) sects.add('actions')
    if (entry.result.reflect) sects.add('questions')
    setVisibleSections(sects)
  }

  // ─── Export ──────────────────────────────────────────────────────────────────

  function handleExport() {
    const md = exportMarkdown(input, results)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `second-brain-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Derived state ────────────────────────────────────────────────────────────

  const charCount = input.length
  const atLimit = charCount >= 5000
  const hasResults = Object.keys(results).length > 0
  const isIdle = phase === 'idle'

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Noise gradient background */}
      <div className="noise-gradient" aria-hidden />

      {/* Background dim overlay (impact moment) */}
      {dimBg && (
        <div
          className="bg-dim-overlay"
          onAnimationEnd={() => setDimBg(false)}
        />
      )}

      {/* ── History Drawer ── */}
      {drawerOpen && (
        <HistoryDrawer
          entries={historyEntries}
          onSelect={handleHistorySelect}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {/* ── DESKTOP PIPELINE — sticky right side ── */}
      {pipelineVisible && (
        <div className="hidden lg:block fixed top-4 right-4 w-72 z-30">
          <PipelineTracker stages={stages} labels={STAGE_LABELS} />
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 max-w-2xl mx-auto px-5 py-0 lg:pr-[19rem]">

        {/* ── HEADER ── */}
        <header className="pt-14 pb-10 text-center relative">
          {/* Slow CSS noise gradient on header */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.8) 0%, transparent 70%)',
              animation: 'noiseGradientShift 20s ease infinite',
            }}
          />

          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#6366f1]/25 bg-[#6366f1]/08 px-4 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase text-[#6366f1]/80 mb-6">
            <span>⚡</span>
            <span className="font-mono">Second Brain Debugger</span>
          </div>

          {/* H1 */}
          <h1 className="text-5xl font-bold tracking-tight text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }}>
            Second Brain
            <span className="header-cursor" aria-hidden />
          </h1>

          <p className="text-[#64748b] text-base leading-relaxed max-w-sm mx-auto">
            Debug your thoughts
          </p>

          {/* Hint for keyboard */}
          {hasResults && (
            <p className="mt-3 text-[10px] font-mono text-white/15">
              ⌘K to collapse all sections
            </p>
          )}
        </header>

        {/* ── MOBILE PIPELINE ── */}
        {pipelineVisible && (
          <div className="lg:hidden mb-4">
            <PipelineTracker stages={stages} labels={STAGE_LABELS} />
          </div>
        )}

        {/* ── INPUT ZONE ── */}
        <div
          style={{
            maxHeight: inputCollapsed ? '0px' : '320px',
            opacity: inputCollapsed ? 0 : 1,
            overflow: 'hidden',
            transition: 'max-height 400ms cubic-bezier(0.16,1,0.3,1), opacity 400ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 mb-5">
            <label htmlFor="brain-input" className="block text-[9px] font-semibold tracking-[0.2em] uppercase text-white/25 mb-3">
              What&rsquo;s on your mind?
            </label>
            <textarea
              id="brain-input"
              value={input}
              onChange={e => setInput(e.target.value.slice(0, 5000))}
              placeholder="Dump everything. Don't edit. Don't organize. Just write."
              disabled={running}
              rows={7}
              className="textarea-glow w-full bg-transparent text-sm text-white/80 placeholder:text-white/15 resize-none border border-white/[0.06] rounded-lg p-3 leading-relaxed transition-all duration-200 focus:border-[#6366f1]/40"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />

            {/* Footer row */}
            <div className="flex items-center justify-between mt-3">
              {/* Char counter fades in after 50 chars */}
              <span
                className="text-[10px] font-mono tabular-nums transition-opacity duration-300"
                style={{ opacity: charCount > 50 ? 1 : 0, color: atLimit ? '#ef4444' : '#475569' }}
              >
                {charCount.toLocaleString()} / 5,000
              </span>

              <div className="flex items-center gap-2">
                {running && (
                  <button
                    onClick={handleStop}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#ef4444]/30 text-[#ef4444]/70 hover:bg-[#ef4444]/08 transition-colors duration-200"
                  >
                    Stop
                  </button>
                )}
                <button
                  id="analyze-btn"
                  onClick={handleRun}
                  disabled={running || charCount < 10}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold border-0 transition-all duration-300 ${running || charCount < 10
                    ? 'bg-[#6366f1]/30 text-white/30 cursor-not-allowed'
                    : 'bg-[#6366f1] text-white hover:bg-[#5558e8] btn-pulse'
                    }`}
                >
                  {running ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analyzing…
                    </span>
                  ) : 'Analyze'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── TERMINAL BOX ── */}
        {terminalVisible && (
          <div
            className="mb-6"
            style={{ animation: 'sectionReveal 300ms cubic-bezier(0.16,1,0.3,1) both' }}
          >
            <div ref={terminalRef} className="terminal-box max-h-36 overflow-y-auto">
              {terminalLines.map((line, i) => (
                <div key={i} className="font-mono">
                  {line}
                  {i === terminalLines.length - 1 && running && (
                    <span className="terminal-cursor" aria-hidden />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && (
          <div
            className="mb-6 rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/08 px-5 py-4 text-sm text-[#ef4444]/80 font-mono"
            style={{ animation: 'sectionReveal 300ms cubic-bezier(0.16,1,0.3,1) both' }}
          >
            ✕ {error}
          </div>
        )}

        {/* ── GHOST UI (idle empty state) ── */}
        {isIdle && !hasResults && (
          <div className="ghost-section space-y-4 mt-2">
            <div className="rounded-xl border border-white/[0.04] p-4">
              <div className="h-2 w-24 rounded bg-white/[0.04] mb-3" />
              <div className="flex flex-wrap gap-2">
                {[90, 120, 80, 110, 95, 75].map((w, i) => (
                  <div key={i} className="h-6 rounded-full bg-white/[0.03]" style={{ width: w }} />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.04] p-4">
              <div className="h-2 w-32 rounded bg-white/[0.04] mb-3" />
              <div className="space-y-2">
                {[100, 70, 85].map((w, i) => (
                  <div key={i} className="h-3 rounded bg-white/[0.03]" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
            <p className="text-center text-[10px] font-mono text-white/15 mt-4">
              6 stages of analysis will appear here
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            OUTPUT SECTIONS — progressive reveal
        ════════════════════════════════════════════════════════════════════ */}

        <div className="space-y-8 pb-32">

          {/* ── 1. THOUGHT CHIPS ── */}
          {(visibleSections.has('thoughts') || results.parse) && (
            <section
              ref={el => { sectionRefs.current.set('thoughts', el) }}
              className="section-reveal"
              style={{ display: allCollapsed ? 'none' : undefined }}
            >
              <SectionHeader icon="🧠" label="Atomic Thoughts" count={results.parse?.thoughts.length} stage="parse" />

              {results.parse ? (
                <div className="relative mt-3">
                  <div className="flex flex-wrap gap-2">
                    {results.parse.thoughts.map((t, i) => {
                      const inCategory = activeCategoryThoughts.includes(t.id)
                      const isHighlighted = activeCategory ? inCategory : false
                      const isDimmed = activeCategory ? !inCategory : false
                      return (
                        <div
                          key={t.id}
                          ref={el => { chipRefs.current.set(t.id, el) }}
                        >
                          <ThoughtChip
                            thought={t}
                            index={i}
                            dimmed={isDimmed}
                            highlighted={isHighlighted}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[140, 100, 120, 90, 110].map((w, i) => (
                    <Shimmer key={i} width={`${w}px`} height="30px" className="rounded-full" />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── 2. CATEGORIES ── */}
          {(visibleSections.has('categories') || results.structure) && (
            <section
              ref={el => { sectionRefs.current.set('categories', el) }}
              className="section-reveal"
              style={{ display: allCollapsed ? 'none' : undefined }}
            >
              <SectionHeader icon="⊞" label="Mental Structure" count={results.structure?.categories.length} stage="structure" />

              {results.structure ? (
                <div className="mt-3 space-y-2">
                  {results.structure.categories.map((cat, i) => {
                    const isActive = activeCategory === cat.name
                    return (
                      <button
                        key={cat.name}
                        onClick={() => handleCategoryClick(cat)}
                        className="w-full text-left rounded-lg border transition-all duration-200 p-3 group"
                        style={{
                          borderColor: isActive ? `${cat.color_tag}50` : 'rgba(255,255,255,0.06)',
                          background: isActive ? `${cat.color_tag}08` : 'rgba(255,255,255,0.02)',
                          animationDelay: `${i * 60}ms`,
                          animation: 'sectionReveal 400ms cubic-bezier(0.16,1,0.3,1) both',
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color_tag }} />
                            <span className="text-sm font-medium text-white/80">{cat.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-white/30">
                            {cat.weight_percentage}%
                          </span>
                        </div>
                        {/* Animated bar */}
                        <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${cat.weight_percentage}%`,
                              background: cat.color_tag,
                              opacity: 0.6,
                              animation: `barFill 600ms ${i * 80}ms cubic-bezier(0.16,1,0.3,1) both`,
                            }}
                          />
                        </div>
                      </button>
                    )
                  })}
                  {activeCategory && (
                    <p className="text-[10px] font-mono text-white/25 text-center pt-1">
                      Click same category to reset · chips highlighted above
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {[1, 2, 3].map(i => <Shimmer key={i} height="52px" />)}
                </div>
              )}
            </section>
          )}

          {/* ── 3. CONFLICTS ── */}
          {(visibleSections.has('conflicts') || results.conflicts) && (
            <section
              ref={el => { sectionRefs.current.set('conflicts', el) }}
              className="section-reveal"
              style={{ display: allCollapsed ? 'none' : undefined }}
            >
              <SectionHeader icon="⚡" label="Internal Conflicts" count={results.conflicts?.conflicts.length} stage="conflicts" />

              {results.conflicts ? (
                results.conflicts.conflicts.length > 0 ? (
                  <div className="mt-3 space-y-4">
                    {results.conflicts.conflicts.map(c => (
                      <ConflictCard key={c.id} conflict={c} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-white/[0.06] p-5 text-center">
                    <p className="text-[#10b981]/60 text-sm font-mono">No major conflicts detected</p>
                  </div>
                )
              ) : (
                <div className="mt-3 space-y-3">
                  {[1, 2].map(i => <Shimmer key={i} height="120px" />)}
                </div>
              )}
            </section>
          )}

          {/* ── 4. CLARITY ── */}
          {(visibleSections.has('clarity') || results.clarity) && (
            <section
              ref={el => { sectionRefs.current.set('clarity', el) }}
              className="section-reveal relative"
              style={{ display: allCollapsed ? 'none' : undefined }}
            >
              <SectionHeader icon="◎" label="Core Clarity" stage="clarity" />

              <div className="mt-3 relative">
                {results.clarity ? (
                  <ClarityCard
                    clarity={results.clarity.clarity}
                    onComplete={() => setDimBg(true)}
                  />
                ) : (
                  <div className="rounded-xl border border-[#10b981]/15 bg-[#0f0f18] p-6">
                    <Shimmer height="24px" className="mb-3 w-3/4" />
                    <Shimmer height="14px" className="mb-2" />
                    <Shimmer height="14px" className="mb-2 w-5/6" />
                    <Shimmer height="14px" className="w-2/3" />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── 5. ACTIONS ── */}
          {(visibleSections.has('actions') || results.actions) && (
            <section
              ref={el => { sectionRefs.current.set('actions', el) }}
              className="section-reveal"
              style={{ display: allCollapsed ? 'none' : undefined }}
            >
              <SectionHeader icon="→" label="Action Plan" count={results.actions?.actions.length} stage="actions" />

              {results.actions ? (
                <div className="mt-3 space-y-3">
                  {results.actions.actions.map((a, i) => (
                    <ActionStep key={a.step_number} action={a} index={i} />
                  ))}
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {[1, 2, 3].map(i => <Shimmer key={i} height="80px" />)}
                </div>
              )}
            </section>
          )}

          {/* ── 6. QUESTIONS ── */}
          {(visibleSections.has('questions') || results.reflect) && (
            <section
              ref={el => { sectionRefs.current.set('questions', el) }}
              className="section-reveal"
              style={{ display: allCollapsed ? 'none' : undefined }}
            >
              <SectionHeader icon="∿" label="Questions to Sit With" count={results.reflect?.questions.length} stage="reflect" />

              {results.reflect ? (
                <div className="mt-3 space-y-2">
                  {/* Sort: surface → deep → existential */}
                  {[...results.reflect.questions]
                    .sort((a, b) => {
                      const order = { surface: 0, deep: 1, existential: 2 }
                      return (order[a.depth_level] ?? 0) - (order[b.depth_level] ?? 0)
                    })
                    .map((q, i) => (
                      <QuestionCard key={q.id} question={q} index={i} />
                    ))}
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {[1, 2, 3, 4, 5].map(i => <Shimmer key={i} height="68px" />)}
                </div>
              )}
            </section>
          )}

          {/* ── SAVED BADGE ── */}
          {savedVisible && (
            <div className="saved-badge flex items-center justify-center gap-2 py-2">
              <span className="text-[#6366f1]/50 text-base">🧠</span>
              <span className="font-mono text-[11px] text-white/25">
                › Saved in your second brain
              </span>
            </div>
          )}

        </div>{/* /space-y-8 */}
      </div>{/* /max-w */}

      {/* ── BOTTOM BAR ── */}
      {hasResults && phase === 'done' && (
        <div
          className="fixed bottom-0 inset-x-0 z-20 slide-up"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}
        >
          <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white/70 transition-colors duration-200 border border-white/[0.07] hover:border-white/15 rounded-lg px-3 py-1.5"
              >
                <span>↓</span>
                <span className="font-mono">Export Brain Dump</span>
              </button>
              <button
                onClick={handleReset}
                disabled={running}
                className="flex items-center gap-1.5 text-xs font-medium text-[#ef4444]/40 hover:text-[#ef4444]/70 transition-colors duration-200 border border-[#ef4444]/[0.1] hover:border-[#ef4444]/25 rounded-lg px-3 py-1.5 disabled:opacity-30"
              >
                <span>↺</span>
                <span className="font-mono">Reset</span>
              </button>
            </div>
            <p className="text-[9px] font-mono text-white/15 hidden sm:block">
              ⌘K collapse all
            </p>
          </div>
        </div>
      )}

      {/* ── HISTORY TRIGGER BUTTON ── */}
      {historyTriggerVisible && historyEntries.length > 0 && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="fixed bottom-16 right-5 z-25 slide-up flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0d0d14]/90 backdrop-blur-sm px-4 py-2.5 text-xs font-mono text-white/40 hover:text-white/70 hover:border-[#6366f1]/25 transition-all duration-200"
        >
          <span>›</span>
          <span>Past sessions ({historyEntries.length})</span>
        </button>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

// ─── Section header ──────────────────────────────────────────────────────────

const STAGE_COLOR: Partial<Record<StageName, string>> = {
  parse:     '#6366f1',
  structure: '#8b5cf6',
  conflicts: '#ef4444',
  clarity:   '#10b981',
  actions:   '#f59e0b',
  reflect:   '#94a3b8',
}

function SectionHeader({
  icon, label, count, stage,
}: {
  icon: string
  label: string
  count?: number
  stage?: StageName
}) {
  const color = stage ? STAGE_COLOR[stage] : '#6366f1'
  return (
    <div className="flex items-center gap-2.5 mb-1">
      <span
        className="text-base w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0"
        style={{ background: `${color}15` }}
      >
        {icon}
      </span>
      <h2 className="text-sm font-semibold text-white/80" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        {label}
      </h2>
      {count !== undefined && (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-white/25 tabular-nums">
          {count}
        </span>
      )}
    </div>
  )
}
