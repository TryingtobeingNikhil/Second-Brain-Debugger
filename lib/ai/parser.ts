import { z } from 'zod'
import { STAGE_SCHEMAS, StageSchemaMap } from './schemas'
import { StageName } from '../types/analysis'

// ─── JSON parsing ──────────────────────────────────────────────────────────────

export function safeParseJSON<T>(text: string): T | null {
  // Attempt 1: direct parse
  try {
    return JSON.parse(text)
  } catch {}

  // Attempt 2: extract first {...} or [...] block
  const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)?.[1]
  if (!match) return null

  // Attempt 3: clean trailing commas + control chars, then retry
  try {
    const cleaned = match
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\x00-\x1F\x7F]/g, '')
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

export async function* parseStreamingJSON<T>(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<Partial<T>> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const partial = safeParseJSON<Partial<T>>(buffer)
    if (partial) yield partial
  }

  const final = safeParseJSON<T>(buffer)
  if (final) yield final
}

// ─── Schema validation ─────────────────────────────────────────────────────────

export function validateStageResult<S extends StageName>(
  stage: S,
  data: unknown
): z.infer<StageSchemaMap[S]> | null {
  if (!data) {
    console.warn(`[SCHEMA] ${stage} received null — returning empty shell`)
    return null
  }

  const schema = STAGE_SCHEMAS[stage]
  const result = schema.safeParse(data)

  if (result.success) {
    return result.data as z.infer<StageSchemaMap[S]>
  }

  // Log schema mismatch but NEVER throw — demo always continues
  console.warn(
    `[SCHEMA] stage=${stage} validation failed:`,
    result.error.flatten()
  )
  return null
}

export function getEmptyStageResult(stage: StageName): object {
  const empty: Record<StageName, object> = {
    parse:     { thoughts: [] },
    structure: { categories: [] },
    conflicts: { conflicts: [] },
    clarity:   { clarity: { core_truth: '', underlying_need: '', what_youre_avoiding: '' } },
    actions:   { actions: [] },
    reflect:   { questions: [] }
  }
  return empty[stage]
}
