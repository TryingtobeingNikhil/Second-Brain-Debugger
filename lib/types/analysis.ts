export interface Thought {
  id: string;
  raw: string;
  emotion_hint: 'anxious' | 'excited' | 'confused' | 'conflicted' | 'neutral' | 'hopeful' | 'defeated';
  urgency: number;
}

export interface Category {
  name: string;
  color_tag: string;
  thoughts: string[];
  weight_percentage: number;
}

export interface Conflict {
  id: string;
  thought_a_id: string;
  thought_b_id: string;
  conflict_type: 'values_clash' | 'desire_vs_fear' | 'identity_conflict' | 'short_vs_long_term' | 'expectation_vs_reality' | 'should_vs_want';
  description: string;
  severity: number;
  resolution_hint: string;
}

export interface Clarity {
  core_truth: string;
  underlying_need: string;
  what_youre_avoiding: string;
}

export interface Action {
  step_number: number;
  title: string;
  description: string;
  timeframe: string;
  energy_required: 'low' | 'medium' | 'high';
  blocks_conflict_id?: string;
  why_this_matters: string;
}

export interface Question {
  id: string;
  question: string;
  why_this_question_matters: string;
  depth_level: 'surface' | 'deep' | 'existential';
}

export interface PipelineStage {
  id: string;
  name: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  result?: any;
}

export interface AnalysisResult {
  thoughts: Thought[];
  categories: Category[];
  conflicts: Conflict[];
  clarity: Clarity;
  actions: Action[];
  questions: Question[];
}
