import { NextRequest } from 'next/server'
import { createSSEStream, sseHeaders } from '@/lib/ai/stream'
import { PROMPTS, MODELS, OXLO_BASE_URL } from '@/lib/ai/prompts'
import { SpeakSchema } from '@/lib/ai/schemas'
import { withRetry } from '@/lib/ai/retry'
import { parseStreamingJSON } from '@/lib/ai/parser'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  if (!process.env.OXLO_API_KEY) {
    return Response.json({ error: 'Missing API key' }, { status: 500 })
  }

  const body = await req.json()
  const { previousStages } = body

  if (!previousStages?.clarity) {
    return Response.json(
      { error: 'Clarity stage required before speech synthesis' },
      { status: 400 }
    )
  }

  const { readable, send, close } = createSSEStream()

  ;(async () => {
    try {
      send({ type: 'stage_start', stage: 'speak' })

      // Step 1: Build the voice script from clarity data
      const scriptResult = await withRetry(async (signal) => {
        const response = await fetch(`${OXLO_BASE_URL}/chat/completions`, {
          method: 'POST',
          signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OXLO_API_KEY}`,
          },
          body: JSON.stringify({
            model: MODELS.strong, // deepseek-v3
            stream: true,
            messages: [
              { role: 'system', content: PROMPTS.speak },
              {
                role: 'user',
                content: `Clarity analysis:\n${JSON.stringify(previousStages.clarity, null, 2)}\n\nWrite the voice script.`,
              },
            ],
          }),
        })

        if (!response.ok) throw new Error(`Script LLM error: ${response.status}`)

        let finalResult = null
        for await (const partial of parseStreamingJSON(response.body!)) {
          finalResult = partial
        }
        return finalResult
      })

      const validated = SpeakSchema.safeParse(scriptResult)
      const scriptData = validated.success ? validated.data : scriptResult as any
      const voiceScript = scriptData?.voice_script || ''

      send({ type: 'partial', stage: 'speak', data: { script: voiceScript } })

      // Step 2: Send script to Kokoro TTS
      const ttsResponse = await fetch(`${OXLO_BASE_URL}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OXLO_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODELS.kokoro, // kokoro-82m
          input: voiceScript,
          voice: 'neutral',
          response_format: 'mp3',
        }),
      })

      if (!ttsResponse.ok) throw new Error(`Kokoro TTS error: ${ttsResponse.status}`)

      // Convert audio to base64 for client
      const audioBuffer = await ttsResponse.arrayBuffer()
      const audioBase64 = Buffer.from(audioBuffer).toString('base64')

      send({
        type: 'stage_complete',
        stage: 'speak',
        data: {
          ...scriptData,
          audio_b64: audioBase64,
          audio_url: `data:audio/mp3;base64,${audioBase64}`,
          // Client: new Audio(data.audio_url).play()
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Speech synthesis failed'
      send({ type: 'error', stage: 'speak', message })
    } finally {
      close()
    }
  })()

  return new Response(readable, { headers: sseHeaders() })
}
