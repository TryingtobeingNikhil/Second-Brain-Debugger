export const delay = (ms: number) =>
  new Promise<void>((res) => setTimeout(res, ms))

export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  retries = 2,
  backoff = 500
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000)

    try {
      const result = await fn(controller.signal)
      clearTimeout(timeout)
      return result
    } catch (err) {
      clearTimeout(timeout)
      if (i === retries) throw err
      await delay(backoff * Math.pow(2, i))
    }
  }

  // TypeScript exhaustiveness — never reached
  throw new Error('Max retries exceeded')
}
