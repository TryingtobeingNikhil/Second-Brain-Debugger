export type EmotionHint =
  | 'anxious'
  | 'excited'
  | 'confused'
  | 'conflicted'
  | 'neutral'
  | 'hopeful'
  | 'defeated'

export type ConflictType =
  | 'values_clash'
  | 'desire_vs_fear'
  | 'identity_conflict'
  | 'short_vs_long_term'
  | 'expectation_vs_reality'
  | 'should_vs_want'

export type EnergyLevel = 'low' | 'medium' | 'high'
export type DepthLevel = 'surface' | 'deep' | 'existential'
export type StageStatus = 'idle' | 'processing' | 'done' | 'error'
export type StageName =
  | 'parse'
  | 'structure'
  | 'conflicts'
  | 'clarity'
  | 'actions'
  | 'reflect'
  | 'transcribe'
  | 'vision'
  | 'imagine'
  | 'speak'

export interface Thought {
  id: string
  raw: string
  emotion_hint: EmotionHint
  urgency: number
}

export interface Category {
  name: string
  color_tag: string
  thoughts: string[]
  weight_percentage: number
}

export interface Conflict {
  id: string
  thought_a_id: string
  thought_b_id: string
  conflict_type: ConflictType
  description: string
  severity: number
  resolution_hint: string
}

export interface Clarity {
  core_truth: string
  underlying_need: string
  what_youre_avoiding: string
}

export interface Action {
  step_number: number
  title: string
  description: string
  timeframe: string
  energy_required: EnergyLevel
  blocks_conflict_id?: string
  why_this_matters: string
}

export interface Question {
  id: string
  question: string
  why_this_question_matters: string
  depth_level: DepthLevel
}

export interface StageResult {
  parse?: { thoughts: Thought[] }
  structure?: { categories: Category[] }
  conflicts?: { conflicts: Conflict[] }
  clarity?: { clarity: Clarity }
  actions?: { actions: Action[] }
  reflect?: { questions: Question[] }
  transcribe?: any
  vision?: any
  imagine?: any
  speak?: any
}

export interface StreamEvent {
  type: 'stage_start' | 'partial' | 'stage_complete' | 'error'
  stage: StageName
  data?: unknown
  message?: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
  sanitized?: string
}

export interface StageLog {
  stage: string
  status: 'success' | 'error'
  duration: number
  error?: string
}
