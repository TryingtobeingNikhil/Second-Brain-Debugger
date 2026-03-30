import { Conflict } from '@/lib/types/analysis'
import { GlowCard } from './GlowCard'

const SEVERITY_COLOR = (s: number) => {
  if (s >= 8) return '#f43f5e'
  if (s >= 5) return '#f97316'
  return '#eab308'
}

const TYPE_LABEL: Record<string, string> = {
  values_clash:           'Values Clash',
  desire_vs_fear:         'Desire vs Fear',
  identity_conflict:      'Identity Conflict',
  short_vs_long_term:     'Short vs Long Term',
  expectation_vs_reality: 'Expectation vs Reality',
  should_vs_want:         'Should vs Want',
}

interface ConflictCardProps {
  conflict: Conflict
}

export function ConflictCard({ conflict }: ConflictCardProps) {
  const color = SEVERITY_COLOR(conflict.severity)

  return (
    <GlowCard accent={color}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border"
            style={{ borderColor: `${color}44`, color, background: `${color}15` }}
          >
            {TYPE_LABEL[conflict.conflict_type] ?? conflict.conflict_type}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-1 h-3 rounded-sm"
                style={{ background: i < conflict.severity ? color : '#ffffff12' }}
              />
            ))}
          </div>
          <span className="text-xs font-bold tabular-nums" style={{ color }}>{conflict.severity}/10</span>
        </div>
      </div>

      <p className="text-sm text-zinc-200 leading-relaxed mb-3">{conflict.description}</p>

      <div className="rounded-lg bg-white/5 px-4 py-3 border border-white/5">
        <p className="text-xs text-zinc-400 mb-1 font-medium tracking-wide uppercase">Resolution hint</p>
        <p className="text-sm text-zinc-300 leading-relaxed">{conflict.resolution_hint}</p>
      </div>

      <div className="flex gap-2 mt-3 text-[10px] text-zinc-500">
        <span className="px-2 py-0.5 rounded bg-white/5">{conflict.thought_a_id}</span>
        <span className="opacity-40">↔</span>
        <span className="px-2 py-0.5 rounded bg-white/5">{conflict.thought_b_id}</span>
      </div>
    </GlowCard>
  )
}
