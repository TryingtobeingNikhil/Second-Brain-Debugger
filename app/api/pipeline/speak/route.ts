import { NextRequest } from 'next/server'
import { createSSEStream, sseHeaders } from '@/lib/ai/stream'
import { PROMPTS, MODELS, OXLO_BASE_URL } from '@/lib/ai/prompts'
import { SpeakSchema } from '@/lib/ai/schemas'
import { withRetry } from '@/lib/ai/retry'
import { parseStreamingJSON } from '@/lib/ai/parser'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { previousStages } = body

  const { readable, send, close } = createSSEStream()

  ;(async () => {
    try {
      send({ type: 'stage_start', stage: 'speak' })

      // ── STUB: no API key → return demo script immediately ──
      if (!process.env.OXLO_API_KEY || !previousStages?.clarity) {
        await new Promise(r => setTimeout(r, 900))
        send({
          type: 'stage_complete',
          stage: 'speak',
          data: {
            voice_script: "You already know what you want. The fear is not real — it is a pattern you've mistaken for information. The next step is obvious.",
            tone: 'direct',
            pause_after_seconds: 2,
            audio_url: '',
            stub: true,
          },
        })
        return
      }

      // Step 1: LLM builds voice script
      const scriptResult = await withRetry(async (signal) => {
        const response = await fetch(`${OXLO_BASE_URL}/chat/completions`, {
          method: 'POST', signal,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OXLO_API_KEY}` },
          body: JSON.stringify({
            model: MODELS.strong,
            stream: true,
            messages: [
              { role: 'system', content: PROMPTS.speak },
              { role: 'user', content: `Clarity analysis:\n${JSON.stringify(previousStages.clarity, null, 2)}\n\nWrite the voice script.` },
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

      // Step 2: Kokoro TTS
      const ttsResponse = await fetch(`${OXLO_BASE_URL}/audio/speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OXLO_API_KEY}` },
        body: JSON.stringify({
          model: MODELS.kokoro,
          input: voiceScript,
          voice: 'neutral',
          response_format: 'mp3',
        }),
      })

      if (!ttsResponse.ok) throw new Error(`Kokoro TTS error: ${ttsResponse.status}`)

      const audioBuffer = await ttsResponse.arrayBuffer()
      const audioBase64 = Buffer.from(audioBuffer).toString('base64')

      send({
        type: 'stage_complete',
        stage: 'speak',
        data: {
          ...scriptData,
          audio_b64: audioBase64,
          audio_url: `data:audio/mp3;base64,${audioBase64}`,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Speech synthesis failed'
      send({
        type: 'stage_complete',
        stage: 'speak',
        data: {
          voice_script: "You already know what you want. The fear is not real. The next step is obvious.",
          tone: 'direct',
          pause_after_seconds: 2,
          audio_url: '',
          stub: true,
          error_detail: message,
        },
      })
    } finally {
      close()
    }
  })()

  return new Response(readable, { headers: sseHeaders() })
}
