import { Thought, EmotionHint } from '@/lib/types/analysis'

const EMOTION_COLORS: Record<EmotionHint, string> = {
  anxious:    'border-orange-500/40 text-orange-300 bg-orange-500/10',
  excited:    'border-yellow-500/40 text-yellow-300 bg-yellow-500/10',
  confused:   'border-blue-500/40  text-blue-300  bg-blue-500/10',
  conflicted: 'border-rose-500/40  text-rose-300  bg-rose-500/10',
  neutral:    'border-zinc-500/40  text-zinc-300  bg-zinc-500/10',
  hopeful:    'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
  defeated:   'border-zinc-600/40  text-zinc-400  bg-zinc-600/10',
}

const URGENCY_DOT: Record<number, string> = {
  1: 'bg-zinc-500', 2: 'bg-zinc-400', 3: 'bg-zinc-300',
  4: 'bg-yellow-400', 5: 'bg-yellow-400', 6: 'bg-orange-400',
  7: 'bg-orange-500', 8: 'bg-rose-400', 9: 'bg-rose-500', 10: 'bg-rose-600',
}

interface ThoughtChipProps {
  thought: Thought
}

export function ThoughtChip({ thought }: ThoughtChipProps) {
  const emotionClass = EMOTION_COLORS[thought.emotion_hint] ?? EMOTION_COLORS.neutral
  const urgencyClass = URGENCY_DOT[Math.min(Math.max(Math.round(thought.urgency), 1), 10)] ?? 'bg-zinc-500'

  return (
    <div
      title={`Urgency: ${thought.urgency}/10 · ${thought.emotion_hint}`}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium cursor-default select-none transition-transform hover:scale-105 ${emotionClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgencyClass}`} />
      <span className="max-w-[220px] truncate">{thought.raw}</span>
      <span className="opacity-50 text-[10px] flex-shrink-0">{thought.id}</span>
    </div>
  )
}
