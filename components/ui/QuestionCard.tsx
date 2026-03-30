import { Question, DepthLevel } from '@/lib/types/analysis'
import { GlowCard } from './GlowCard'

const DEPTH_CONFIG: Record<DepthLevel, { label: string; accent: string }> = {
  surface:     { label: 'Surface',     accent: '#94a3b8' },
  deep:        { label: 'Deep',        accent: '#a78bfa' },
  existential: { label: 'Existential', accent: '#f43f5e' },
}

interface QuestionCardProps {
  question: Question
}

export function QuestionCard({ question }: QuestionCardProps) {
  const depth = DEPTH_CONFIG[question.depth_level] ?? DEPTH_CONFIG.deep

  return (
    <GlowCard accent={depth.accent}>
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
          style={{ background: `${depth.accent}22`, color: depth.accent, border: `1px solid ${depth.accent}44` }}
        >
          ?
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-100 leading-relaxed mb-2">
            {question.question}
          </p>
          <p className="text-xs text-zinc-500 leading-relaxed italic">
            {question.why_this_question_matters}
          </p>
          <div
            className="mt-2 text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: depth.accent }}
          >
            {depth.label}
          </div>
        </div>
      </div>
    </GlowCard>
  )
}
