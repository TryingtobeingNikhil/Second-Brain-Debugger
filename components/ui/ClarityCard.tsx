import { Clarity } from '@/lib/types/analysis'
import { GlowCard } from './GlowCard'

interface ClarityCardProps {
  clarity: Clarity
}

const rows: { key: keyof Clarity; label: string; accent: string }[] = [
  { key: 'core_truth',        label: 'Core Truth',        accent: '#a78bfa' },
  { key: 'underlying_need',   label: 'Underlying Need',   accent: '#34d399' },
  { key: 'what_youre_avoiding', label: "What You're Avoiding", accent: '#fb923c' },
]

export function ClarityCard({ clarity }: ClarityCardProps) {
  return (
    <div className="grid gap-3">
      {rows.map(({ key, label, accent }) => (
        <GlowCard key={key} accent={accent}>
          <p
            className="text-[10px] font-semibold tracking-widest uppercase mb-2"
            style={{ color: accent }}
          >
            {label}
          </p>
          <p className="text-sm text-zinc-100 leading-relaxed">{clarity[key]}</p>
        </GlowCard>
      ))}
    </div>
  )
}
