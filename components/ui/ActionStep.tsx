import { Action, EnergyLevel } from '@/lib/types/analysis'
import { GlowCard } from './GlowCard'

const ENERGY_CONFIG: Record<EnergyLevel, { label: string; color: string }> = {
  low:    { label: 'Low energy',    color: '#34d399' },
  medium: { label: 'Medium energy', color: '#fbbf24' },
  high:   { label: 'High energy',   color: '#f87171' },
}

interface ActionStepProps {
  action: Action
}

export function ActionStep({ action }: ActionStepProps) {
  const energy = ENERGY_CONFIG[action.energy_required] ?? ENERGY_CONFIG.medium

  return (
    <GlowCard>
      <div className="flex items-start gap-4">
        {/* Step number */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300">
          {action.step_number}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white">{action.title}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                style={{ borderColor: `${energy.color}40`, color: energy.color, background: `${energy.color}15` }}
              >
                {energy.label}
              </span>
              <span className="text-[10px] text-zinc-500 whitespace-nowrap">{action.timeframe}</span>
            </div>
          </div>

          <p className="text-sm text-zinc-400 leading-relaxed mb-2">{action.description}</p>

          <p className="text-xs text-zinc-500 italic">
            <span className="text-zinc-600 not-italic font-medium">Why: </span>
            {action.why_this_matters}
          </p>

          {action.blocks_conflict_id && (
            <div className="mt-2 text-[10px] text-zinc-600">
              Resolves conflict{' '}
              <span className="text-violet-500 font-mono">{action.blocks_conflict_id}</span>
            </div>
          )}
        </div>
      </div>
    </GlowCard>
  )
}
