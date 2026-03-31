'use client'

import {
  useState, useRef, useEffect, useCallback, useReducer, useMemo
} from 'react'
import {
  StageResult, StageName, StreamEvent
} from '@/lib/types/analysis'

// ─── Design Tokens (inline for canvas architecture) ──────────────────────────
const T = {
  bg: '#0a0a0a',
  surface: '#111111',
  surfaceHover: '#161616',
  border: 'rgba(255,255,255,0.07)',
  borderActive: 'rgba(0,255,136,0.35)',
  textPrimary: '#f0f0f0',
  textSecondary: '#888888',
  textTertiary: '#444444',
  green: '#00ff88',
  greenDim: '#00cc66',
  red: '#ff4444',
  amber: '#ffaa00',
  glowGreen: 'rgba(0,255,136,0.12)',
  glowRed: 'rgba(255,68,68,0.15)',
  mono: 'JetBrains Mono, monospace',
}

// ─── State Machine ────────────────────────────────────────────────────────────
type Stage = 'idle'|'parsing'|'structuring'|'detecting'|'clarifying'|'planning'|'reflecting'|'done'

interface AppState {
  stage: Stage
  epoch: number
  compute: number
  lossHistory: number[]
  pipelineLogs: string[]
  analysisStart: number | null
}

type Action =
  | { type: 'START' }
  | { type: 'TICK_STAGE'; stage: Stage; loss: number; log: string }
  | { type: 'ADD_LOG'; log: string }
  | { type: 'TICK_COMPUTE' }
  | { type: 'DONE' }
  | { type: 'RESET' }

const LOSS_MAP: Record<Stage, number> = {
  idle: 0.85, parsing: 0.72, structuring: 0.55, detecting: 0.61,
  clarifying: 0.34, planning: 0.18, reflecting: 0.12, done: 0.09,
}

const STATUS_TEXT: Record<Stage, string> = {
  idle: '○ Awaiting input signal...',
  parsing: 'Harvesting input signal...',
  structuring: 'Propagating forward pass...',
  detecting: 'Backpropagating conflicts...',
  clarifying: 'Converging to clarity...',
  planning: 'Computing loss gradients...',
  reflecting: 'Reflecting on latent space...',
  done: '● Latent Space Balanced',
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START':
      return { ...state, stage: 'parsing', epoch: 1, compute: 0, lossHistory: [0.85], pipelineLogs: ['[INIT] Loading thought_vectors... OK'], analysisStart: Date.now() }
    case 'TICK_STAGE':
      return { ...state, stage: action.stage, epoch: state.epoch + 1, lossHistory: [...state.lossHistory, action.loss], pipelineLogs: [...state.pipelineLogs.slice(-3), action.log] }
    case 'ADD_LOG':
      return { ...state, pipelineLogs: [...state.pipelineLogs.slice(-3), action.log] }
    case 'TICK_COMPUTE':
      return { ...state, compute: state.compute + 0.1 }
    case 'DONE':
      return { ...state, stage: 'done', lossHistory: [...state.lossHistory, 0.09], pipelineLogs: [...state.pipelineLogs.slice(-3), '[SUCCESS] Weights converged. loss=0.09'] }
    case 'RESET':
      return { stage: 'idle', epoch: 1, compute: 0, lossHistory: [0.85], pipelineLogs: [], analysisStart: null }
    default:
      return state
  }
}

const initState: AppState = { stage: 'idle', epoch: 1, compute: 0, lossHistory: [0.85], pipelineLogs: [], analysisStart: null }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
const randFloat = (min: number, max: number) => +(Math.random() * (max - min) + min).toFixed(3)
// NOTE: randConf is only called inside useRef hooks — never at render/module level
function makeConf() { return +(72 + Math.random() * 24).toFixed(1) }

const STAGE_ORDER: StageName[] = ['parse','structure','conflicts','clarity','actions','reflect']
const DEMO_INPUT = `I want to build something meaningful but I'm afraid I'm not smart enough and I keep procrastinating instead of starting.`

const HIGH_ATTN_WORDS = new Set(['fear','anxiety','goal','want','hate','love','stuck','lost','need','dream','fail','success','career','money','purpose','identity','afraid','procrastinating'])
const KEYWORDS_TYPEWRITER = new Set(['fear','anxiety','breakthrough','goal','stuck','clarity','identity','failure','purpose','dream'])
const FILLER_TYPEWRITER = new Set(['the','and','is','a','to','of','in','it','that'])

// ─── Token Rain Canvas ────────────────────────────────────────────────────────
const TOKEN_POOL = ['w[0]','w[1]','∂L/∂w','relu(x)','softmax','0.847','dropout','epoch_14','loss:0.023','grad_norm','backprop','∇θ','attention','embed_dim','LayerNorm','0x882']

function TokenRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const cols = TOKEN_POOL.map((tok, i) => ({
      tok, x: (i / TOKEN_POOL.length) * window.innerWidth + Math.random() * 60,
      y: Math.random() * window.innerHeight,
      speed: 0.3 + Math.random() * 0.6,
    }))
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.font = '10px JetBrains Mono, monospace'
      ctx.fillStyle = '#00ff88'
      cols.forEach(c => {
        ctx.fillText(c.tok, c.x, c.y)
        c.y += c.speed
        if (c.y > canvas.height + 20) c.y = -20
      })
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [])
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, width:'100vw', height:'100vh', pointerEvents:'none', zIndex:1, opacity:0.025 }} />
}

// ─── Cursor Glow ──────────────────────────────────────────────────────────────
function CursorGlow() {
  const divRef = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })
  const raf = useRef(0)
  useEffect(() => {
    const onMove = (e: MouseEvent) => { target.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove, { passive: true })
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.06
      current.current.y += (target.current.y - current.current.y) * 0.06
      if (divRef.current) {
        divRef.current.style.background = `radial-gradient(380px circle at ${current.current.x}px ${current.current.y}px, rgba(0,255,136,0.07), transparent)`
      }
      raf.current = requestAnimationFrame(tick)
    }
    tick()
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf.current) }
  }, [])
  return <div ref={divRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:2 }} />
}

// ─── Attention Heatmap Input ──────────────────────────────────────────────────
function AttentionInput({ value, onChange, onRun, disabled }: {
  value: string; onChange: (v: string) => void; onRun: () => void; disabled: boolean
}) {
  const [weights, setWeights] = useState<Record<string, number>>({})
  const [showAttn, setShowAttn] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const computeWeights = useCallback((text: string) => {
    const words = text.split(' ')
    const w: Record<string, number> = {}
    words.forEach((word, i) => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, '')
      const base = HIGH_ATTN_WORDS.has(clean) ? 0.85 + Math.random() * 0.1 : randFloat(0.05, 0.95)
      w[`${word}-${i}`] = base
    })
    setWeights(w)
    setShowAttn(true)
  }, [])

  const handleBlur = () => { if (value.trim()) computeWeights(value) }
  const handleChange = (v: string) => {
    onChange(v)
  }

  const words = value.split(' ')
  const confRef = useRef<number | null>(null)
  if (confRef.current === null) confRef.current = makeConf()
  const conf = confRef.current

  return (
    <div style={{ position:'absolute', top:'44%', left:'3%', transform:'translateY(-50%)', width:280, zIndex:10 }}>
      <div style={{ fontSize:9, color:'rgba(0,255,136,0.3)', letterSpacing:'0.12em', fontFamily:T.mono, marginBottom:4 }}>[INPUT_LAYER]</div>
      <div style={{ background:T.surface, border:`1px dashed rgba(0,255,136,0.18)`, borderRadius:4, padding:'14px 16px' }}>
        {showAttn && value ? (
          <div style={{ cursor:'text' }} onClick={() => { if (!disabled) setShowAttn(false) }}>
            <div style={{ fontSize:9, color:'rgba(0,255,136,0.4)', fontFamily:T.mono, marginBottom:8, letterSpacing:'0.06em' }}>[ATTENTION] click to edit</div>
            <div style={{ lineHeight:'1.8', marginBottom:10 }}>
              {words.map((word, i) => {
                const key = `${word}-${i}`
                const w = weights[key] ?? 0.3
                const bg = w > 0.7 ? 'rgba(0,255,136,0.25)' : w > 0.4 ? 'rgba(0,255,136,0.10)' : 'transparent'
                const color = w > 0.7 ? T.green : w > 0.4 ? T.greenDim : T.textSecondary
                return (
                  <span key={key} style={{ background:bg, color, fontFamily:T.mono, fontSize:11, padding:'1px 3px', borderRadius:2, marginRight:3, transition:'all 0.3s ease', transitionDelay:`${i * 30}ms`, display:'inline-block' }}>
                    {word}
                  </span>
                )
              })}
            </div>
          </div>
        ) : (
          <textarea
            autoFocus
            value={value}
            onChange={e => handleChange(e.target.value.slice(0, 5000))}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder="Dump your thoughts here..."
            rows={6}
            style={{ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontFamily:T.mono, fontSize:11, color:T.textPrimary, lineHeight:1.7, caretColor:T.green }}
          />
        )}
        <div style={{ marginTop:8 }}>
          <div style={{ fontSize:8, color:'rgba(0,255,136,0.3)', fontFamily:T.mono, marginBottom:4 }} suppressHydrationWarning>CONFIDENCE: {conf}%</div>
          <div style={{ height:2, background:'rgba(255,255,255,0.05)', borderRadius:1 }}>
            <div style={{ height:'100%', width:`${conf}%`, background:T.green, borderRadius:1, transition:'width 800ms ease-out' }} />
          </div>
        </div>
        <button
          onClick={onRun}
          disabled={disabled || value.trim().length < 10}
          style={{
            marginTop:12, width:'100%', padding:'8px 0', background:'transparent',
            border:`1px dashed ${disabled ? 'rgba(0,255,136,0.2)' : T.green}`,
            color: disabled ? 'rgba(0,255,136,0.3)' : T.green,
            fontFamily:T.mono, fontSize:11, letterSpacing:'0.08em', cursor: disabled?'not-allowed':'pointer',
            borderRadius:2, transition:'all 0.2s',
          }}
        >
          {disabled ? '[ ▸ PROCESSING... ]' : '[ > RUN FORWARD PASS ]'}
        </button>
      </div>
    </div>
  )
}

// ─── Node Card Base ───────────────────────────────────────────────────────────
function NodeCard({ label, layerLabel, top, left, width, active, redPulse, children, confColor }: {
  label: string; layerLabel: string; top: string; left: string; width: number
  active?: boolean; redPulse?: boolean; children: React.ReactNode; confColor?: string
}) {
  const confRef = useRef<number | null>(null)
  if (confRef.current === null) confRef.current = makeConf()
  const conf = confRef.current
  const border = redPulse
    ? `1px solid rgba(255,68,68,0.5)`
    : active
      ? `1px solid ${T.green}`
      : `1px dashed rgba(255,255,255,0.06)`
  const shadow = active ? `0 0 20px rgba(0,255,136,0.12)` : redPulse ? `0 0 18px rgba(255,68,68,0.18)` : 'none'

  return (
    <div style={{ position:'absolute', top, left, width, zIndex:10 }}>
      <div style={{ fontSize:9, color:'rgba(0,255,136,0.18)', letterSpacing:'0.12em', fontFamily:T.mono, marginBottom:4 }}>{layerLabel}</div>
      <div style={{ background:T.surface, border, borderRadius:4, padding:'14px 16px', boxShadow:shadow, transition:'all 0.4s ease', overflow:'hidden', maxWidth:'100%' }}>
        <div style={{ fontSize:9, color:'rgba(0,255,136,0.5)', fontFamily:T.mono, letterSpacing:'0.1em', marginBottom:10, textTransform:'uppercase', paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>{label}</div>
        <div style={{ overflow:'hidden', wordBreak:'break-word' }}>{children}</div>
        <div style={{ marginTop:10 }}>
          <div style={{ fontSize:8, color: active ? 'rgba(0,255,136,0.7)' : 'rgba(0,255,136,0.35)', fontFamily:T.mono, marginBottom:3 }} suppressHydrationWarning>
            {confColor === T.red ? `TENSION: ${conf}%` : `CONFIDENCE: ${conf}%`}
          </div>
          <div style={{ height:1.5, background:'rgba(255,255,255,0.05)', borderRadius:1 }}>
            <div style={{ height:'100%', width: active ? `${conf}%` : '0%', background: confColor || T.green, borderRadius:1, transition:'width 800ms ease-out' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Atomic Thoughts Node ─────────────────────────────────────────────────────
function AtomicThoughtsNode({ thoughts, active }: { thoughts?: Array<{id:string;raw:string;emotion_hint:string;urgency:number}>; active?: boolean }) {
  const items = thoughts ?? []
  return (
    <NodeCard label="[ATOMIC_THOUGHTS]" layerLabel="[HIDDEN_L1]" top="18%" left="24%" width={240} active={active}>
      {items.length > 0 ? (
        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
          {items.slice(0,6).map((t,i) => (
            <div key={t.id} draggable style={{
              background:'rgba(0,255,136,0.07)', border:`1px dashed rgba(0,255,136,0.2)`,
              borderRadius:2, padding:'3px 7px', fontFamily:T.mono, fontSize:10, color:T.green,
              cursor:'grab', transition:'all 0.2s', animationDelay:`${i*60}ms`
            }}>
              {t.raw.slice(0,22)}{t.raw.length>22?'…':''}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color:T.textTertiary, fontFamily:T.mono, fontSize:10 }}>Awaiting parse...</div>
      )}
    </NodeCard>
  )
}

// ─── Pipeline Tracker Node ────────────────────────────────────────────────────
function PipelineTrackerNode({ logs, active, appStage }: { logs: string[]; active?: boolean; appStage: Stage }) {
  const stageList: { name: string; key: Stage; done: boolean; current: boolean }[] = [
    { name: 'parse', key: 'parsing', done: ['structuring','detecting','clarifying','planning','reflecting','done'].some(s => s === appStage), current: appStage === 'parsing' },
    { name: 'structure', key: 'structuring', done: ['detecting','clarifying','planning','reflecting','done'].some(s => s === appStage), current: appStage === 'structuring' },
    { name: 'conflicts', key: 'detecting', done: ['clarifying','planning','reflecting','done'].some(s => s === appStage), current: appStage === 'detecting' },
    { name: 'clarity', key: 'clarifying', done: ['planning','reflecting','done'].some(s => s === appStage), current: appStage === 'clarifying' },
    { name: 'actions', key: 'planning', done: ['reflecting','done'].some(s => s === appStage), current: appStage === 'planning' },
    { name: 'reflect', key: 'reflecting', done: appStage === 'done', current: appStage === 'reflecting' },
  ]
  return (
    <NodeCard label="[PIPELINE_TRACKER]" layerLabel="[HIDDEN_L1]" top="58%" left="24%" width={240} active={active}>
      <div style={{ marginBottom:8 }}>
        {stageList.map(s => (
          <div key={s.name} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, fontFamily:T.mono, fontSize:10 }}>
            <span style={{ color: s.done ? T.green : s.current ? T.amber : T.textTertiary }}>
              {s.done ? '●' : s.current ? '○' : '·'}
            </span>
            <span style={{ color: s.done ? T.green : s.current ? T.textPrimary : T.textTertiary }}>{s.name}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop:`1px dashed rgba(0,255,136,0.1)`, paddingTop:8 }}>
        {logs.slice(-3).map((log, i) => (
          <div key={i} style={{ fontFamily:T.mono, fontSize:9, color:'rgba(0,255,136,0.4)', marginBottom:2, opacity: i === logs.length-1 || i === 2 ? 1 : 0.5, transition:'opacity 0.3s', wordBreak:'break-word' }}>
            {log}
          </div>
        ))}
      </div>
    </NodeCard>
  )
}

// ─── Conflict Node ────────────────────────────────────────────────────────────
function ConflictNode({ conflicts, active }: { conflicts?: Array<{id:string;conflict_type:string;description:string;severity:number;resolution_hint:string}>; active?: boolean }) {
  const items = conflicts ?? []
  return (
    <NodeCard label="[CONFLICT_DETECTED]" layerLabel="[HIDDEN_L2]" top="12%" left="46%" width={260} active={active} confColor={T.red}>
      {items.length > 0 ? items.slice(0,3).map(c => (
        <div key={c.id} style={{ marginBottom:10, padding:'8px 10px', background:'rgba(255,68,68,0.05)', border:`1px dashed rgba(255,68,68,0.2)`, borderRadius:3, overflow:'hidden' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, alignItems:'center' }}>
            <span style={{ fontFamily:T.mono, fontSize:9, color:'rgba(255,68,68,0.6)', letterSpacing:'0.12em' }}>{c.conflict_type.toUpperCase()}</span>
            <span style={{ fontFamily:T.mono, fontSize:11, color:T.red }}>{c.severity}/10</span>
          </div>
          <div style={{ fontFamily:T.mono, fontSize:10, color:T.textSecondary, marginBottom:4, lineHeight:1.5, wordBreak:'break-word', overflow:'hidden' }}>{c.description.slice(0,80)}...</div>
          <div style={{ height:1.5, background:'rgba(255,68,68,0.1)', borderRadius:1 }}>
            <div style={{ height:'100%', width:`${c.severity * 10}%`, background:T.red, borderRadius:1 }} />
          </div>
        </div>
      )) : (
        <div style={{ color:T.textTertiary, fontFamily:T.mono, fontSize:10 }}>Scanning for conflicts...</div>
      )}
    </NodeCard>
  )
}

// ─── Typewriter for Clarity ───────────────────────────────────────────────────
function TypewriterClarity({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('')
  const [idx, setIdx] = useState(0)
  const ref = useRef<ReturnType<typeof setTimeout>>()
  const doneRef = useRef(false)

  useEffect(() => {
    if (!text) return
    setDisplayed(''); setIdx(0); doneRef.current = false
    const words = text.split(' ')
    let charIdx = 0
    const fullText = '[OUTPUT] ' + text

    const type = () => {
      if (charIdx >= fullText.length) {
        if (!doneRef.current) { doneRef.current = true; onDone?.() }
        return
      }
      const char = fullText[charIdx]
      // Check if next word is keyword
      const remaining = fullText.slice(charIdx)
      const wordMatch = remaining.match(/^([a-zA-Z]+)/)
      let ms = 60
      if (wordMatch) {
        const word = wordMatch[1].toLowerCase()
        if (KEYWORDS_TYPEWRITER.has(word)) ms = 400
        else if (FILLER_TYPEWRITER.has(word)) ms = 25
      }
      setDisplayed(prev => prev + char)
      charIdx++
      ref.current = setTimeout(type, ms)
    }
    ref.current = setTimeout(type, 200)
    return () => clearTimeout(ref.current)
  }, [text])

  const parts = displayed.split(' ')
  return (
    <div style={{ fontFamily:T.mono, fontSize:11, color:T.textSecondary, lineHeight:1.8, width:'100%', overflowWrap:'break-word', whiteSpace:'pre-wrap', overflow:'hidden' }}>
      {parts.map((word, i) => {
        const isKeyword = KEYWORDS_TYPEWRITER.has(word.toLowerCase().replace(/[^a-z]/g,''))
        const isPrefix = word === '[OUTPUT]'
        return (
          <span key={i} style={{
            color: isPrefix ? 'rgba(0,255,136,0.4)' : isKeyword ? T.green : undefined,
            textShadow: isKeyword ? `0 0 10px rgba(0,255,136,0.5)` : undefined,
            marginRight: 4
          }}>
            {word}
          </span>
        )
      })}
      <span style={{ display:'inline-block', width:2, height:'1em', background:T.green, verticalAlign:'text-bottom', animation:'blink 1s step-end infinite' }} />
    </div>
  )
}

// ─── Clarity Node ─────────────────────────────────────────────────────────────
function ClarityNode({ clarity, active }: { clarity?: {core_truth:string;underlying_need:string;what_youre_avoiding:string}; active?: boolean }) {
  return (
    <NodeCard label="[CLARITY_OUTPUT]" layerLabel="[HIDDEN_L2]" top="55%" left="46%" width={260} active={active}>
      {clarity ? (
        <TypewriterClarity text={clarity.core_truth} />
      ) : (
        <div style={{ color:T.textTertiary, fontFamily:T.mono, fontSize:10 }}>Awaiting clarity signal...</div>
      )}
    </NodeCard>
  )
}

// ─── Action Node ──────────────────────────────────────────────────────────────
function ActionNode({ actions, active }: { actions?: Array<{step_number:number;title:string;description:string;timeframe:string;energy_required:string}>; active?: boolean }) {
  const items = actions ?? []
  return (
    <NodeCard label="[ACTION_PLAN]" layerLabel="[HIDDEN_L3]" top="32%" left="67%" width={250} active={active}>
      {items.length > 0 ? items.slice(0,4).map((a,i) => (
        <div key={a.step_number} style={{ marginBottom:6, display:'flex', gap:8, alignItems:'flex-start', lineHeight:1.6 }}>
          <span style={{ fontFamily:T.mono, fontSize:10, color:T.green, minWidth:16 }}>{a.step_number}.</span>
          <div style={{ overflow:'hidden', wordBreak:'break-word', flex:1 }}>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.textPrimary, marginBottom:2, wordBreak:'break-word' }}>{a.title}</div>
            <div style={{ fontFamily:T.mono, fontSize:9, color:T.textSecondary }}>{a.timeframe} · {a.energy_required}</div>
          </div>
        </div>
      )) : (
        <div style={{ color:T.textTertiary, fontFamily:T.mono, fontSize:10 }}>Planning sequence...</div>
      )}
    </NodeCard>
  )
}

// ─── Existential Node ─────────────────────────────────────────────────────────
function ExistentialNode({ questions, active, mounted }: {
  questions?: Array<{id:string;question:string;depth_level:string}>; active?: boolean; mounted: boolean
}) {
  const [shaking, setShaking] = useState(false)
  const [borderOpacity, setBorderOpacity] = useState(0.8)
  useEffect(() => {
    if (mounted) {
      setShaking(true)
      setTimeout(() => setShaking(false), 200)
      // Fade border red→dim
      let o = 0.8
      const iv = setInterval(() => {
        o = Math.max(0.15, o - 0.02)
        setBorderOpacity(o)
        if (o <= 0.15) clearInterval(iv)
      }, 100)
    }
  }, [mounted])

  const items = questions ?? []
  const pulse = active && !mounted ? undefined : undefined

  return (
    <NodeCard
      label="[EXISTENTIAL_QUERY]"
      layerLabel="[OUTPUT_LAYER]"
      top="30%"
      left="84%"
      width={260}
      redPulse={mounted}
      active={active && !mounted}
    >
      <div style={shaking ? { animation:'shake 200ms ease' } : {}}>
        {items.length > 0 ? items.slice(0,4).map((q,i) => (
          <div key={q.id} style={{
            marginBottom:12, padding:'6px 8px',
            border:`1px dashed rgba(255,68,68,${0.15 + (i===0?0.3:0.1)})`,
            borderBottom: i < items.slice(0,4).length-1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
            borderRadius:3, fontFamily:T.mono, fontSize:10, color: i===0 ? T.textPrimary : T.textSecondary,
            lineHeight:1.5, wordBreak:'break-word', overflow:'hidden'
          }}>
            <span style={{ color:'rgba(255,68,68,0.4)', marginRight:6, fontSize:9 }}>[{q.depth_level.toUpperCase()}]</span>
            {q.question}
          </div>
        )) : (
          <div style={{ color:T.textTertiary, fontFamily:T.mono, fontSize:10 }}>Reflecting...</div>
        )}
      </div>
    </NodeCard>
  )
}

// ─── SVG Neural Edges ─────────────────────────────────────────────────────────
// Node approximate center points as % of viewport (will use px for final positions)
// These are computed based on the absolute positions + widths declared above

const EDGE_DEFS = [
  { id:'i-at', x1:300+280, y1:.44, x2:.24, y2:.26 },
  { id:'i-pt', x1:300+280, y1:.44, x2:.24, y2:.67 },
  { id:'at-cn', x1:.24+240, y1:.26, x2:.46, y2:.20 },
  { id:'at-cl', x1:.24+240, y1:.26, x2:.46, y2:.63 },
  { id:'pt-cn', x1:.24+240, y1:.67, x2:.46, y2:.20 },
  { id:'cn-ac', x1:.46+260, y1:.20, x2:.67, y2:.40 },
  { id:'cl-ac', x1:.46+260, y1:.63, x2:.67, y2:.40 },
  { id:'ac-ex', x1:.67+250, y1:.40, x2:.84, y2:.40 },
]

function NeuralEdges({ active, backprop, hoveredNode }: { active: boolean; backprop: boolean; hoveredNode: string | null }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const weightsRef = useRef<number[]>([])
  if (weightsRef.current.length === 0) {
    weightsRef.current = Array.from({ length: 8 }, () => randFloat(0.1, 0.99))
  }
  const edgeWeights = weightsRef.current
  const [dims, setDims] = useState({ w: 1440, h: 900 })
  useEffect(() => {
    setDims({ w: Math.max(window.innerWidth, 1600), h: window.innerHeight })
    const onResize = () => setDims({ w: Math.max(window.innerWidth, 1600), h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const W = dims.w, H = dims.h

  // Convert the edge defs into pixel coords
  const edges = useMemo(() => [
    { id:'i-at',  x1: W*0.03+280, y1: H*0.44, x2: W*0.24,       y2: H*0.26 },
    { id:'i-pt',  x1: W*0.03+280, y1: H*0.44, x2: W*0.24,       y2: H*0.67 },
    { id:'at-cn', x1: W*0.24+240, y1: H*0.26, x2: W*0.46,       y2: H*0.20 },
    { id:'at-cl', x1: W*0.24+240, y1: H*0.26, x2: W*0.46,       y2: H*0.63 },
    { id:'pt-cn', x1: W*0.24+240, y1: H*0.67, x2: W*0.46,       y2: H*0.20 },
    { id:'cn-ac', x1: W*0.46+260, y1: H*0.20, x2: W*0.67,       y2: H*0.40 },
    { id:'cl-ac', x1: W*0.46+260, y1: H*0.63, x2: W*0.67,       y2: H*0.40 },
    { id:'ac-ex', x1: W*0.67+250, y1: H*0.40, x2: W*0.84,       y2: H*0.40 },
  ], [W, H])

  return (
    <svg ref={svgRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:1 }}>
      <defs>
        {edges.map((e, i) => (
          <path key={`path-def-${i}`} id={`edge-${e.id}`}
            d={`M${e.x1},${e.y1} C${e.x1+80},${e.y1} ${e.x2-80},${e.y2} ${e.x2},${e.y2}`}
            fill="none"
          />
        ))}
      </defs>
      {edges.map((e, i) => {
        const d = `M${e.x1},${e.y1} C${e.x1+80},${e.y1} ${e.x2-80},${e.y2} ${e.x2},${e.y2}`
        const mx = (e.x1 + e.x2) / 2
        const my = (e.y1 + e.y2) / 2
        const strokeColor = backprop ? T.red : active ? 'rgba(0,255,136,0.25)' : 'rgba(0,255,136,0.07)'
        return (
          <g key={e.id}>
            <path
              d={d}
              stroke={strokeColor}
              strokeWidth={active ? 1.5 : 1}
              strokeDasharray="3 7"
              fill="none"
              style={{ transition:'stroke 0.5s ease, stroke-width 0.3s ease' }}
            />
            <text x={mx} y={my-6} style={{ fontSize:8, fontFamily:T.mono, fill:'rgba(0,255,136,0.25)' }} suppressHydrationWarning>
              w: {edgeWeights[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Live Loss Curve ──────────────────────────────────────────────────────────
function LossCurve({ lossHistory }: { lossHistory: number[] }) {
  const W = 180, H = 80, PAD = 20
  const plotW = W - PAD, plotH = H - 14
  const pts = lossHistory.map((v, i) => {
    const x = PAD + (i / Math.max(lossHistory.length - 1, 1)) * plotW
    const y = 4 + (1 - v) * plotH
    return `${x},${y}`
  }).join(' ')

  return (
    <div style={{ position:'fixed', bottom:40, left:16, zIndex:20, width:W }}>
      <div style={{ fontSize:9, color:'rgba(0,255,136,0.4)', fontFamily:T.mono, letterSpacing:'0.12em', marginBottom:4 }}>[TRAINING_LOSS]</div>
      <svg width={W} height={H} style={{ display:'block', overflow:'visible', background:'rgba(0,255,136,0.03)', border:'1px dashed rgba(0,255,136,0.1)' }}>
        <line x1={PAD} y1={4} x2={PAD} y2={H-10} stroke="rgba(0,255,136,0.15)" strokeWidth={1}/>
        <line x1={PAD} y1={H-10} x2={W-4} y2={H-10} stroke="rgba(0,255,136,0.15)" strokeWidth={1}/>
        <text x={PAD-14} y={H/2} style={{ fontSize:8, fontFamily:T.mono, fill:'rgba(0,255,136,0.25)' }}>loss</text>
        <text x={W/2} y={H} style={{ fontSize:8, fontFamily:T.mono, fill:'rgba(0,255,136,0.25)' }}>epoch</text>
        {lossHistory.length > 1 && (
          <>
            <polygon points={`${pts} ${W-PAD},${H-10} ${PAD},${H-10}`} fill="rgba(0,255,136,0.04)"/>
            <polyline points={pts} stroke="rgba(0,255,136,0.6)" strokeWidth={1.5} fill="none"/>
          </>
        )}
      </svg>
    </div>
  )
}

// ─── Status Bar ───────────────────────────────────────────────────────────────
function StatusBar({ appState, onExport, sessionId }: {
  appState: AppState; onExport: () => void; sessionId: string
}) {
  const { stage, epoch, compute } = appState
  const nodeCount = 16
  const edgeCount = 8
  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0, height:26,
      background:'#0d0d0d', borderTop:'1px solid rgba(0,255,136,0.08)',
      zIndex:50, display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 16px', fontFamily:T.mono, fontSize:10, color:'rgba(0,255,136,0.45)'
    }}>
      <span suppressHydrationWarning>
        {'> '}SBD-{sessionId}
        <span style={{ margin:'0 6px', color:'rgba(0,255,136,0.2)' }}>|</span>
        NODES: {nodeCount}
        <span style={{ margin:'0 6px', color:'rgba(0,255,136,0.2)' }}>|</span>
        EDGES: {edgeCount}
        <span style={{ margin:'0 6px', color:'rgba(0,255,136,0.2)' }}>|</span>
        EPOCH: {String(epoch).padStart(3, '0')}
        <span style={{ margin:'0 6px', color:'rgba(0,255,136,0.2)' }}>|</span>
        COMPUTE: {compute.toFixed(1)}k GFLOPs
      </span>
      <span style={{ display:'flex', alignItems:'center', gap:16, flex:1, justifyContent:'flex-end' }}>
        <span>
          {stage === 'done' ? (
            <><span style={{ color:T.green }}>●</span> STATUS: {STATUS_TEXT[stage]}</>
          ) : (
            <><span style={{ color:T.amber, animation:'statusPulse 1.2s infinite' }}>●</span> STATUS: {STATUS_TEXT[stage]}</>
          )}
        </span>
        <button
          onClick={onExport}
          style={{ background:'transparent', border:`1px dashed rgba(0,255,136,0.3)`, color:'rgba(0,255,136,0.6)', fontFamily:T.mono, fontSize:10, padding:'2px 8px', cursor:'pointer', letterSpacing:'0.06em' }}
        >
          {'[ > EXPORT MODEL CARD ]'}
        </button>
      </span>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      ` }} />
    </div>
  )
}

// ─── Model Card Modal ─────────────────────────────────────────────────────────
function ModelCardModal({ results, input, appState, elapsed, onClose }: {
  results: StageResult; input: string; appState: AppState; elapsed: number; onClose: () => void
}) {
  const [lines, setLines] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const conflicts = results.conflicts?.conflicts ?? []
  const actions = results.actions?.actions ?? []
  const questions = results.reflect?.questions ?? []
  const words = input.trim().split(/\s+/).length
  const maxConflict = conflicts.reduce((m, c) => Math.max(m, c.severity), 0)
  const statsRef = useRef({ clarityScore: 0, gflops: 0 })
  if (statsRef.current.clarityScore === 0) {
    statsRef.current.clarityScore = +(0.5 + Math.random() * 0.5).toFixed(2)
    statsRef.current.gflops = +(1.2 + Math.random() * 3.8).toFixed(1)
  }
  const { clarityScore, gflops } = statsRef.current
  const finalLoss = appState.lossHistory[appState.lossHistory.length - 1] ?? 0.09
  const nodeCount = 16, synapseCount = 8

  const allLines = [
    '---',
    '## Model: thought_encoder_v1',
    '---',
    `base_model:        second_brain_debugger`,
    `architecture:      Transformer (6L · 8H · 512d)`,
    `task:              cognitive_conflict_resolution`,
    '---',
    '## Input',
    `raw_thought:       "${input.slice(0, 60)}${input.length > 60 ? '...' : ''}"`,
    `tokens:            ${words} tokens`,
    `attention_heads:   8`,
    '---',
    '## Analysis Results',
    `conflicts_detected: ${conflicts.length} (severity: ${maxConflict}/10)`,
    `clarity_score:      ${clarityScore}/1.00`,
    `tension_peak:       stage_3 (loss spike: +0.06)`,
    `convergence:        epoch_${appState.epoch}, loss=${finalLoss}`,
    '---',
    '## Recommended Actions',
    ...actions.map(a => `- ${a.title}`),
    '---',
    '## Existential Queries',
    ...questions.map(q => `- ${q.question}`),
    '---',
    '## Weights',
    `status:            CONVERGED`,
    `parameters:        ${nodeCount} mapped · ${synapseCount} weighted`,
    `inference_time:    ${elapsed}ms`,
    `flops:             ${gflops} GFLOPs`,
    '---',
    '// generated by second_brain_debugger · nikhil mourya',
  ]

  useEffect(() => {
    let i = 0
    const iv = setInterval(() => {
      if (i < allLines.length) { setLines(prev => [...prev, allLines[i]]); i++ }
      else clearInterval(iv)
    }, 80)
    return () => clearInterval(iv)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(allLines.join('\n'))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{
        background:T.bg, border:`1px dashed rgba(0,255,136,0.3)`, borderRadius:4,
        padding:'40px', maxWidth:600, width:'90vw', maxHeight:'80vh', overflow:'auto',
        position:'relative'
      }}>
        <div style={{ fontFamily:T.mono, fontSize:12 }}>
          {lines.map((line, i) => (
            <div key={i} style={{
              marginBottom:3, color:
                line?.startsWith('##') ? T.green :
                line?.startsWith('---') ? 'rgba(0,255,136,0.3)' :
                line?.startsWith('//') ? 'rgba(0,255,136,0.25)' :
                line?.startsWith('-') ? T.textSecondary :
                T.textPrimary,
              fontWeight: line?.startsWith('##') ? 600 : 400,
            }}>
              {line || '\u00a0'}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:12, marginTop:24, justifyContent:'flex-end' }}>
          <button onClick={handleCopy} style={{ background:'transparent', border:`1px dashed rgba(0,255,136,0.3)`, color:'rgba(0,255,136,0.6)', fontFamily:T.mono, fontSize:11, padding:'6px 14px', cursor:'pointer' }}>
            {copied ? '[ ✓ COPIED ]' : '[ > COPY RAW ]'}
          </button>
          <button onClick={onClose} style={{ background:'transparent', border:`1px dashed rgba(0,255,136,0.3)`, color:'rgba(0,255,136,0.6)', fontFamily:T.mono, fontSize:11, padding:'6px 14px', cursor:'pointer' }}>
            {'[ > CLOSE ]'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [input, setInput] = useState(DEMO_INPUT)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<StageResult>({})
  const [error, setError] = useState<string | null>(null)
  const [existentialMounted, setExistentialMounted] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  const [dimOverlay, setDimOverlay] = useState(false)
  const [appState, dispatch] = useReducer(reducer, initState)
  const abortRef = useRef<AbortController | null>(null)
  const computeRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionId = useRef(Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4,'0')).current
  const startTime = useRef<number>(0)

  // Active node tracking
  const activeNode = useMemo(() => {
    const { stage } = appState
    if (stage === 'parsing') return 'atomic'
    if (stage === 'structuring') return 'pipeline'
    if (stage === 'detecting') return 'conflict'
    if (stage === 'clarifying') return 'clarity'
    if (stage === 'planning') return 'action'
    if (stage === 'reflecting') return 'existential'
    if (stage === 'done') return 'done'
    return 'none'
  }, [appState.stage])

  // Run a single stage
  async function runStage(stage: StageName, inputText: string, previousStages: StageResult): Promise<unknown> {
    const res = await fetch(`/api/analyze/${stage}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: inputText, previousStages }),
      signal: abortRef.current?.signal,
    })
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({ error: `Stage ${stage} failed` }))
      throw new Error(err.error || `Stage ${stage} failed`)
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = '', stageData: unknown = null
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
          if (event.type === 'stage_complete') stageData = event.data
          if (event.type === 'error') throw new Error(event.message ?? `Stage ${stage} error`)
        } catch { /* ignore partial */ }
      }
    }
    return stageData
  }

  // Master run
  async function handleRun() {
    if (!input.trim() || running) return
    setRunning(true); setError(null); setResults({})
    setExistentialMounted(false)
    startTime.current = Date.now()
    abortRef.current = new AbortController()
    dispatch({ type: 'START' })

    // Compute ticker
    if (computeRef.current) clearInterval(computeRef.current)
    computeRef.current = setInterval(() => dispatch({ type: 'TICK_COMPUTE' }), 180)

    const accumulated: StageResult = {}
    const stagePairs: Array<[StageName, Stage, number, string]> = [
      ['parse',     'parsing',     0.72, '[PROCESS] AtomicNode.parse(input)'],
      ['structure', 'structuring', 0.55, '[PROCESS] Structure.build(thoughts)'],
      ['conflicts', 'detecting',   0.61, '[PROCESS] Conflict.detect(threshold=0.72)\n[METRIC] tension_score: 0.847'],
      ['clarity',   'clarifying',  0.34, '[METRIC] clarity_delta: +0.34'],
      ['actions',   'planning',    0.18, '[OPTIMIZE] Clarity.backprop(depth="existential")'],
      ['reflect',   'reflecting',  0.12, '[PROCESS] Existential.load(q_depth=max)'],
    ]

    try {
      for (const [stageName, appStage, loss, log] of stagePairs) {
        dispatch({ type: 'TICK_STAGE', stage: appStage, loss, log })
        const data = await runStage(stageName, input, { ...accumulated })
        ;(accumulated as Record<string, unknown>)[stageName] = data
        setResults({ ...accumulated })
        dispatch({ type: 'ADD_LOG', log: `[SUCCESS] ${stageName} → loss=${loss}` })
        await delay(300)
      }

      // Existential sequence
      await delay(300)
      setDimOverlay(true)
      await delay(400)
      setScreenShake(true); setTimeout(() => setScreenShake(false), 200)
      await delay(800)
      setExistentialMounted(true)
      await delay(300)
      setDimOverlay(false)

      if (computeRef.current) clearInterval(computeRef.current)
      dispatch({ type: 'DONE' })
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Analysis failed')
      }
    } finally {
      setRunning(false)
      if (computeRef.current) clearInterval(computeRef.current)
    }
  }

  function handleReset() {
    abortRef.current?.abort()
    setRunning(false); setResults({}); setError(null)
    setExistentialMounted(false); setDimOverlay(false)
    dispatch({ type: 'RESET' })
    setInput('')
  }

  const elapsed = appState.analysisStart ? Date.now() - appState.analysisStart : 0
  const isActive = running
  const backprop = appState.stage === 'detecting'
  const isDone = appState.stage === 'done'

  return (
    <div style={{
      position:'fixed', inset:0, width:'100vw', height:'100vh',
      overflowX:'auto', overflowY:'hidden', background:T.bg,
      animation: screenShake ? 'screenShake 200ms ease' : undefined,
      paddingTop: 52, paddingBottom: 26, boxSizing: 'border-box'
    }}>
      {/* ── HEADER ── */}
      <header style={{
        position:'fixed', top:0, left:0, right:0, height:52,
        background:'rgba(10,10,10,0.95)', borderBottom:'1px solid rgba(0,255,136,0.1)',
        backdropFilter:'blur(8px)', zIndex:50, display:'flex', alignItems:'center',
        justifyContent:'space-between', padding:'0 24px'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontFamily:T.mono, fontSize:16, fontWeight:600, color:'#f0f0f0' }}>Second Brain Debugger</span>
          <span style={{ fontFamily:T.mono, fontSize:11, color:'rgba(0,255,136,0.5)' }}>// debug your thoughts like an ML engineer</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {isDone && (
            <button onClick={handleReset} style={{
              background:'transparent', border:'1px dashed rgba(255,68,68,0.3)',
              color:'rgba(255,68,68,0.6)', fontFamily:T.mono, fontSize:10,
              padding:'4px 12px', cursor:'pointer', letterSpacing:'0.06em', transition:'all 0.2s'
            }}>
              {`[ > RESET ]`}
            </button>
          )}
          <span style={{
            background:'rgba(0,255,136,0.08)', border:'1px dashed rgba(0,255,136,0.25)',
            color:'rgba(0,255,136,0.7)', fontSize:10, padding:'4px 12px', borderRadius:99, fontFamily:T.mono
          }}>
            ● NEURAL ENGINE v2
          </span>
        </div>
      </header>

      {/* Dot grid */}
      <div style={{
        position:'fixed', inset:0, zIndex:0, pointerEvents:'none',
        backgroundImage:'radial-gradient(circle, rgba(0,255,136,0.04) 1px, transparent 1px)',
        backgroundSize:'28px 28px',
      }} />

      {/* Token rain */}
      <TokenRain />

      {/* Cursor glow */}
      <CursorGlow />

      {/* Dim overlay for existential sequence */}
      {dimOverlay && (
        <div style={{
          position:'fixed', inset:0, zIndex:8, background:'rgba(0,0,0,0.12)',
          animation:'fadeInOut 400ms ease', pointerEvents:'none'
        }} />
      )}

      <div style={{ position:'relative', minWidth:1600, width:'100%', height:'100%' }}>
        {/* Neural edges SVG */}
      <NeuralEdges active={isActive || isDone} backprop={backprop} hoveredNode={null} />

      {/* ── LAYER 0: INPUT ── */}
      <AttentionInput value={input} onChange={setInput} onRun={handleRun} disabled={running} />

      {/* ── LAYER 1: HIDDEN L1 ── */}
      <AtomicThoughtsNode thoughts={results.parse?.thoughts} active={activeNode === 'atomic' || isDone} />
      <PipelineTrackerNode logs={appState.pipelineLogs} active={activeNode === 'pipeline' || isDone} appStage={appState.stage} />

      {/* ── LAYER 2: HIDDEN L2 ── */}
      <ConflictNode conflicts={results.conflicts?.conflicts} active={activeNode === 'conflict' || isDone} />
      <ClarityNode clarity={results.clarity?.clarity} active={activeNode === 'clarity' || isDone} />

      {/* ── LAYER 3: HIDDEN L3 ── */}
      <ActionNode actions={results.actions?.actions} active={activeNode === 'action' || isDone} />

      {/* ── LAYER 4: OUTPUT ── */}
      <ExistentialNode
        questions={results.reflect?.questions}
        active={activeNode === 'existential'}
        mounted={existentialMounted}
      />
      </div>

      {/* Loss curve */}
      <LossCurve lossHistory={appState.lossHistory} />

      {/* Status bar */}
      <StatusBar appState={appState} onExport={() => setShowExport(true)} sessionId={sessionId} />

      {/* Error */}
      {error && (
        <div style={{
          position:'absolute', top:16, left:'50%', transform:'translateX(-50%)',
          zIndex:30, background:'rgba(255,68,68,0.08)', border:`1px dashed ${T.red}`,
          borderRadius:4, padding:'8px 20px', fontFamily:T.mono, fontSize:11, color:T.red
        }}>
          [ERROR] {error}
        </div>
      )}

      {/* Export modal */}
      {showExport && (
        <ModelCardModal
          results={results} input={input} appState={appState}
          elapsed={elapsed} onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
