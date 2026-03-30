import { streamSSE } from './stream'
import { StreamEvent, StageName, StageResult } from '../types/analysis'

export async function* runFullPipeline(
  input: string
): AsyncGenerator<StreamEvent> {
  const stages: StageResult = {}
  const stageOrder: StageName[] = [
    'parse',
    'structure',
    'conflicts',
    'clarity',
    'actions',
    'reflect',
  ]

  for (const stage of stageOrder) {
    try {
      const response = await fetch(`/api/analyze/${stage}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, previousStages: stages }),
      })

      if (!response.ok || !response.body) {
        yield {
          type: 'error',
          stage,
          message: `Stage ${stage} failed: ${response.status}`,
        }
        continue
      }

      console.time(`[PIPELINE] ${stage}`)
      for await (const event of streamSSE<StreamEvent>(response.body)) {
        yield event
        if (event.type === 'stage_complete' && event.data) {
          stages[stage] = event.data as StageResult[typeof stage]
        }
      }
      console.timeEnd(`[PIPELINE] ${stage}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error'
      console.error(`[PIPELINE] ${stage} network failure:`, message)
      yield { type: 'error', stage, message }
      continue
    }
  }
}
