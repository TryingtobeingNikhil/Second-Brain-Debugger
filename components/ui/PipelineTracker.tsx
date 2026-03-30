import { StageName, StageStatus } from '@/lib/types/analysis'

interface PipelineTrackerProps {
  stages: Partial<Record<StageName, StageStatus>>
  labels: Record<StageName, string>
}

const STATUS_CONFIG: Record<StageStatus, { icon: string; color: string; pulse: boolean }> = {
  idle:       { icon: '○', color: 'text-zinc-600', pulse: false },
  processing: { icon: '◉', color: 'text-violet-400', pulse: true },
  done:       { icon: '●', color: 'text-emerald-400', pulse: false },
  error:      { icon: '✕', color: 'text-rose-400',   pulse: false },
}

const ALL_STAGES: StageName[] = ['parse', 'structure', 'conflicts', 'clarity', 'actions', 'reflect']

export function PipelineTracker({ stages, labels }: PipelineTrackerProps) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4">
      <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase mb-4">Pipeline</p>
      <div className="flex items-center gap-0">
        {ALL_STAGES.map((stage, i) => {
          const status: StageStatus = stages[stage] ?? 'idle'
          const cfg = STATUS_CONFIG[status]
          const isLast = i === ALL_STAGES.length - 1

          return (
            <div key={stage} className="flex items-center flex-1">
              {/* Node */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <span
                  className={`text-base leading-none ${cfg.color} ${cfg.pulse ? 'animate-pulse' : ''}`}
                >
                  {cfg.icon}
                </span>
                <span className="text-[9px] text-zinc-500 whitespace-nowrap">{labels[stage]}</span>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className="flex-1 h-px mx-1 bg-white/8">
                  <div
                    className="h-full bg-emerald-500/60 transition-all duration-700"
                    style={{ width: status === 'done' ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
