import { z } from 'zod'

// ─── Primitive enums ───────────────────────────────────────────────────────────

export const EmotionHintSchema = z.enum([
  'anxious',
  'excited',
  'confused',
  'conflicted',
  'neutral',
  'hopeful',
  'defeated',
])

export const ConflictTypeSchema = z.enum([
  'values_clash',
  'desire_vs_fear',
  'identity_conflict',
  'short_vs_long_term',
  'expectation_vs_reality',
  'should_vs_want',
])

export const EnergySchema = z.enum(['low', 'medium', 'high'])
export const DepthSchema = z.enum(['surface', 'deep', 'existential'])

// ─── Stage schemas ─────────────────────────────────────────────────────────────

export const ParseSchema = z.object({
  thoughts: z.array(
    z.object({
      id: z.string(),
      raw: z.string(),
      emotion_hint: EmotionHintSchema,
      urgency: z.number().min(1).max(10),
    })
  ),
})

export const StructureSchema = z.object({
  categories: z.array(
    z.object({
      name: z.string(),
      color_tag: z.string(),
      thoughts: z.array(z.string()),
      weight_percentage: z.number().min(0).max(100),
    })
  ),
})

export const ConflictsSchema = z.object({
  conflicts: z.array(
    z.object({
      id: z.string(),
      thought_a_id: z.string(),
      thought_b_id: z.string(),
      conflict_type: ConflictTypeSchema,
      description: z.string(),
      severity: z.number().min(1).max(10),
      resolution_hint: z.string(),
    })
  ),
})

export const ClaritySchema = z.object({
  clarity: z.object({
    core_truth: z.string(),
    underlying_need: z.string(),
    what_youre_avoiding: z.string(),
  }),
})

export const ActionsSchema = z.object({
  actions: z
    .array(
      z.object({
        step_number: z.number(),
        title: z.string(),
        description: z.string(),
        timeframe: z.string(),
        energy_required: EnergySchema,
        blocks_conflict_id: z.string().optional(),
        why_this_matters: z.string(),
      })
    )
    .max(6),
})

export const ReflectSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string(),
        question: z.string(),
        why_this_question_matters: z.string(),
        depth_level: DepthSchema,
      })
    )
    .length(5),
})

// ─── Multimodal stage schemas ──────────────────────────────────────────────────

export const VisionSchema = z.object({
  extracted_text: z.string(),
  visual_mood: z.enum([
    'chaotic', 'structured', 'anxious',
    'defeated', 'hopeful', 'overwhelmed'
  ]),
  confidence: z.number().min(0).max(1),
  image_type: z.enum([
    'notes', 'journal', 'todo',
    'screenshot', 'photo', 'other'
  ]),
})

export const ImagineSchema = z.object({
  sd_prompt: z.string(),
  negative_prompt: z.string(),
  dominant_metaphor: z.string(),
  emotional_temperature: z.enum([
    'cold', 'volatile', 'fragmented', 'heavy', 'electric'
  ]),
})

export const SpeakSchema = z.object({
  voice_script: z.string().max(500),
  tone: z.enum(['direct', 'confrontational', 'gentle', 'analytical']),
  pause_after_seconds: z.number().min(0).max(10),
})

export type VisionResult   = z.infer<typeof VisionSchema>
export type ImagineResult  = z.infer<typeof ImagineSchema>
export type SpeakResult    = z.infer<typeof SpeakSchema>

// ─── Unified stage map ─────────────────────────────────────────────────────────

export const STAGE_SCHEMAS = {
  parse: ParseSchema,
  structure: StructureSchema,
  conflicts: ConflictsSchema,
  clarity: ClaritySchema,
  actions: ActionsSchema,
  reflect: ReflectSchema,
  transcribe: z.any(),
  vision: VisionSchema,
  imagine: ImagineSchema,
  speak: SpeakSchema,
} as const

export type StageSchemaMap = typeof STAGE_SCHEMAS
