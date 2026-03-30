import { NextRequest } from 'next/server'
import { validateInput } from '@/lib/validation'
import { parseStreamingJSON, validateStageResult, getEmptyStageResult } from '@/lib/ai/parser'
import { withRetry } from '@/lib/ai/retry'
import { createSSEStream, sseHeaders } from '@/lib/ai/stream'
import { createPipelineLogger } from '@/lib/observability'
import { PROMPTS, MODELS, OXLO_BASE_URL } from '@/lib/ai/prompts'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  if (!process.env.OXLO_API_KEY) {
    return Response.json(
      { error: 'Server misconfiguration: missing API key' },
      { status: 500 }
    )
  }
  const body = await req.json()
  const validation = validateInput(body.input)

  if (!validation.valid)
    return Response.json({ error: validation.error }, { status: 400 })

  const { readable, send, close } = createSSEStream()
  const logger = createPipelineLogger()
  const STAGE = 'conflicts' as const
  const log = logger.start(STAGE)

  ;(async () => {
    try {
      send({ type: 'stage_start', stage: STAGE })

      const result = await withRetry(async (signal) => {
        const response = await fetch(`${OXLO_BASE_URL}/chat/completions`, {
          method: 'POST',
          signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OXLO_API_KEY}`,
          },
          body: JSON.stringify({
            model: MODELS.strong,
            stream: true,
            messages: [
              { role: 'system', content: PROMPTS.conflicts },
              {
                role: 'user',
                content: `Input: ${validation.sanitized}\n\nPrevious stages: ${JSON.stringify(body.previousStages || {})}`,
              },
            ],
          }),
        })

        if (!response.ok)
          throw new Error(`Oxlo API error: ${response.status}`)

        let finalResult = null
        for await (const partial of parseStreamingJSON(response.body!)) {
          send({ type: 'partial', stage: STAGE, data: partial })
          finalResult = partial
        }
        return finalResult
      })

      const validated = validateStageResult(STAGE, result)
      if (validated) {
        send({ type: 'stage_complete', stage: STAGE, data: validated })
      } else {
        console.warn(`[SCHEMA] ${STAGE} falling back to unvalidated output`)
        send({ type: 'stage_complete', stage: STAGE, data: result ?? getEmptyStageResult(STAGE) })
      }
      log.success()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      send({ type: 'error', stage: STAGE, message })
      log.error(message)
    } finally {
      close()
    }
  })()

  return new Response(readable, { headers: sseHeaders() })
}
