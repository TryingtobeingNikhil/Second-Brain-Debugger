export const delay = (ms: number) =>
  new Promise<void>((res) => setTimeout(res, ms))

export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  retries = 3,
  backoff = 2000
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000) // increased timeout for slower responses

    try {
      const result = await fn(controller.signal)
      clearTimeout(timeout)
      return result
    } catch (err) {
      clearTimeout(timeout)
      if (i === retries) throw err
      
      const isRateLimit = err instanceof Error && err.message.includes('429')
      // Increase backoff significantly if it's a 429 error
      const waitTime = isRateLimit ? 
        backoff * Math.pow(2, i + 1) : 
        backoff * Math.pow(2, i)
        
      console.warn(`[RETRY] Attempt ${i+1}/${retries} failed, waiting ${waitTime}ms...`, isRateLimit ? '(Rate Limit 429)' : '')
      await delay(waitTime)
    }
  }

  // TypeScript exhaustiveness — never reached
  throw new Error('Max retries exceeded')
}
