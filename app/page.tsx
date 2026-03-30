'use client'

import { useState, useRef } from 'react'
import { PipelineTracker } from '@/components/ui/PipelineTracker'
import { ThoughtChip } from '@/components/ui/ThoughtChip'
import { ConflictCard } from '@/components/ui/ConflictCard'
import { ClarityCard } from '@/components/ui/ClarityCard'
import { ActionStep } from '@/components/ui/ActionStep'
import { QuestionCard } from '@/components/ui/QuestionCard'
import { GlowCard } from '@/components/ui/GlowCard'
import { StageResult, StageName, StageStatus, StreamEvent } from '@/lib/types/analysis'

const STAGE_ORDER: StageName[] = ['parse', 'structure', 'conflicts', 'clarity', 'actions', 'reflect']

const STAGE_LABELS: Record<StageName, string> = {
  parse: 'Parsing Thoughts',
  structure: 'Building Structure',
  conflicts: 'Finding Conflicts',
  clarity: 'Extracting Clarity',
  actions: 'Planning Actions',
  reflect: 'Forming Questions',
}

export default function Home() {
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [stages, setStages] = useState<Partial<Record<StageName, StageStatus>>>({})
  const [results, setResults] = useState<StageResult>({})
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function runStage(
    stage: StageName,
    input: string,
    previousStages: StageResult
  ) {
    setStages(s => ({ ...s, [stage]: 'processing' }))

    const res = await fetch(`/api/analyze/${stage}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, previousStages }),
      signal: abortRef.current?.signal,
    })

    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({ error: `Stage ${stage} failed` }))
      throw new Error(err.error || `Stage ${stage} failed with ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let stageData: unknown = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const event: StreamEvent = JSON.parse(line.slice(6))
          if (event.type === 'stage_complete') stageData = event.data
          if (event.type === 'error') throw new Error(event.message)
        } catch {}
      }
    }

    setStages(s => ({ ...s, [stage]: 'done' }))
    return stageData
  }

  async function handleRun() {
    if (!input.trim() || running) return
    setRunning(true)
    setError(null)
    setResults({})
    setStages({})
    abortRef.current = new AbortController()

    const accumulated: StageResult = {}

    try {
      for (const stage of STAGE_ORDER) {
        const data = await runStage(stage, input, accumulated)
        // TS can't narrow the union through a dynamic key — unknown cast is intentional
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accumulated[stage] = data as any
        setResults({ ...accumulated })
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    } finally {
      setRunning(false)
    }
  }

  function handleStop() {
    abortRef.current?.abort()
    setRunning(false)
  }

  const charCount = input.length
  const atLimit = charCount >= 5000

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      {/* Hero */}
      <div className="border-b border-white/5 px-6 py-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium tracking-widest text-violet-300 uppercase mb-6">
          ⚡ Second Brain Debugger
        </div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent mb-3">
          Untangle Your Mind
        </h1>
        <p className="text-zinc-400 max-w-md mx-auto text-sm leading-relaxed">
          Dump every thought. Six AI stages parse, structure, find conflicts,
          extract clarity, plan actions, and ask the questions you've been avoiding.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Input */}
        <GlowCard>
          <label htmlFor="brain-input" className="block text-xs font-semibold tracking-widest text-zinc-400 uppercase mb-3">
            What's on your mind?
          </label>
          <textarea
            id="brain-input"
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 5000))}
            placeholder="Just dump it all. Messy is fine. Contradictions, fears, half-formed ideas — all of it..."
            className="w-full h-44 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 resize-none outline-none leading-relaxed"
            disabled={running}
          />
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
            <span className={`text-xs tabular-nums ${atLimit ? 'text-rose-400' : 'text-zinc-500'}`}>
              {charCount} / 5000
            </span>
            <div className="flex gap-3">
              {running && (
                <button
                  onClick={handleStop}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  Stop
                </button>
              )}
              <button
                id="analyze-btn"
                onClick={handleRun}
                disabled={running || charCount < 10}
                className="px-6 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {running ? 'Analyzing…' : 'Analyze'}
              </button>
            </div>
          </div>
        </GlowCard>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-300">
            ⚠ {error}
          </div>
        )}

        {/* Pipeline tracker */}
        {Object.keys(stages).length > 0 && (
          <PipelineTracker stages={stages} labels={STAGE_LABELS} />
        )}

        {/* Results */}
        {results.parse && (
          <section>
            <SectionHeader emoji="🧠" title="Raw Thoughts" count={results.parse.thoughts.length} />
            <div className="flex flex-wrap gap-2 mt-3">
              {results.parse.thoughts.map(t => (
                <ThoughtChip key={t.id} thought={t} />
              ))}
            </div>
          </section>
        )}

        {results.structure && (
          <section>
            <SectionHeader emoji="🗂" title="Mental Structure" count={results.structure.categories.length} />
            <div className="mt-3 grid gap-3">
              {results.structure.categories.map(cat => (
                <GlowCard key={cat.name} accent={cat.color_tag}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: cat.color_tag }} />
                      <span className="font-semibold text-sm">{cat.name}</span>
                    </div>
                    <span className="text-xs text-zinc-400">{cat.weight_percentage}% of headspace</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {cat.thoughts.map(id => (
                      <span key={id} className="text-xs px-2 py-0.5 rounded bg-white/5 text-zinc-400">{id}</span>
                    ))}
                  </div>
                </GlowCard>
              ))}
            </div>
          </section>
        )}

        {results.conflicts && results.conflicts.conflicts.length > 0 && (
          <section>
            <SectionHeader emoji="⚡" title="Internal Conflicts" count={results.conflicts.conflicts.length} />
            <div className="mt-3 grid gap-3">
              {results.conflicts.conflicts.map(c => (
                <ConflictCard key={c.id} conflict={c} />
              ))}
            </div>
          </section>
        )}

        {results.clarity && (
          <section>
            <SectionHeader emoji="🔍" title="Core Clarity" />
            <div className="mt-3">
              <ClarityCard clarity={results.clarity.clarity} />
            </div>
          </section>
        )}

        {results.actions && (
          <section>
            <SectionHeader emoji="🎯" title="Action Plan" count={results.actions.actions.length} />
            <div className="mt-3 grid gap-3">
              {results.actions.actions.map(a => (
                <ActionStep key={a.step_number} action={a} />
              ))}
            </div>
          </section>
        )}

        {results.reflect && (
          <section>
            <SectionHeader emoji="🪞" title="Questions to Sit With" count={results.reflect.questions.length} />
            <div className="mt-3 grid gap-3">
              {results.reflect.questions.map(q => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function SectionHeader({ emoji, title, count }: { emoji: string; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{emoji}</span>
      <h2 className="font-semibold text-white">{title}</h2>
      {count !== undefined && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 tabular-nums">{count}</span>
      )}
    </div>
  )
}
