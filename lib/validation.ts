import { ValidationResult } from './types/analysis'

export function validateInput(input: unknown): ValidationResult {
  if (!input || typeof input !== 'string')
    return { valid: false, error: 'Input must be a non-empty string' }

  const sanitized = input
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .trim()

  if (sanitized.length === 0)
    return { valid: false, error: 'Input cannot be empty' }

  if (sanitized.length < 10)
    return { valid: false, error: 'Input too short to analyze' }

  if (sanitized.length >= 5000)
    return { valid: false, error: 'Input exceeds 5000 character limit' }

  return { valid: true, sanitized }
}
