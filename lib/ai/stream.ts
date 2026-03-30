import { StreamEvent } from '../types/analysis'

export function createSSEStream() {
  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController<Uint8Array>

  const readable = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c
    },
  })

  const send = (event: StreamEvent) => {
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
    )
  }

  const close = () => controller.close()

  return { readable, send, close }
}

export function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  }
}

export async function* streamSSE<T>(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<T> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''

    for (const part of parts) {
      const line = part.replace(/^data: /, '').trim()
      if (!line || line === '[DONE]') continue
      try {
        yield JSON.parse(line) as T
      } catch {}
    }
  }
}
