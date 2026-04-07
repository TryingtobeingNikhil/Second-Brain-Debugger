import { NextRequest } from 'next/server'
import { createSSEStream, sseHeaders } from '@/lib/ai/stream'
import { PROMPTS, MODELS, OXLO_BASE_URL } from '@/lib/ai/prompts'
import { ImagineSchema } from '@/lib/ai/schemas'
import { withRetry } from '@/lib/ai/retry'
import { parseStreamingJSON } from '@/lib/ai/parser'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { previousStages } = body

  const { readable, send, close } = createSSEStream()

  ;(async () => {
    try {
      send({ type: 'stage_start', stage: 'imagine' })

      // ── STUB: no API key → return demo image immediately ──
      if (!process.env.OXLO_API_KEY || !previousStages?.conflicts) {
        await new Promise(r => setTimeout(r, 1200)) // simulate latency
        send({
          type: 'stage_complete',
          stage: 'imagine',
          data: {
            sd_prompt: 'abstract fragmented neural pathways, dark void, hacker green tendrils, electric synapses',
            negative_prompt: 'faces, people, text, warm colors',
            dominant_metaphor: 'fractured lattice',
            emotional_temperature: 'electric',
            image_url: `https://picsum.photos/400/300?random=${Date.now() % 100}`,
            image_b64: null,
            stub: true,
          },
        })
        return
      }

      // Step 1: LLM builds SD prompt
      const promptResult = await withRetry(async (signal) => {
        const response = await fetch(`${OXLO_BASE_URL}/chat/completions`, {
          method: 'POST', signal,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OXLO_API_KEY}` },
          body: JSON.stringify({
            model: MODELS.strong,
            stream: true,
            messages: [
              { role: 'system', content: PROMPTS.imagine },
              { role: 'user', content: `Cognitive analysis:\n${JSON.stringify(previousStages, null, 2)}\n\nBuild the visual prompt.` },
            ],
          }),
        })
        if (!response.ok) throw new Error(`LLM error: ${response.status}`)
        let finalResult = null
        for await (const partial of parseStreamingJSON(response.body!)) {
          finalResult = partial
        }
        return finalResult
      })

      const validated = ImagineSchema.safeParse(promptResult)
      const sdData = validated.success ? validated.data : promptResult as any
      send({ type: 'partial', stage: 'imagine', data: { prompt_built: true, ...sdData } })

      // Step 2: Stable Diffusion
      const sdResponse = await fetch(`${OXLO_BASE_URL}/images/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OXLO_API_KEY}` },
        body: JSON.stringify({
          model: MODELS.imagine,
          prompt: sdData?.sd_prompt || 'abstract neural network dark background hacker green',
          negative_prompt: sdData?.negative_prompt || 'faces, people, text',
          n: 1, size: '512x512', response_format: 'b64_json',
        }),
      })

      if (!sdResponse.ok) throw new Error(`SD API error: ${sdResponse.status}`)
      const sdResult = await sdResponse.json()
      const imageData = sdResult.data?.[0]?.b64_json

      send({
        type: 'stage_complete',
        stage: 'imagine',
        data: {
          ...sdData,
          image_b64: imageData,
          image_url: imageData ? `data:image/png;base64,${imageData}` : `https://picsum.photos/400/300?random=42`,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image generation failed'
      // Fallback to stock photo stub
      send({
        type: 'stage_complete',
        stage: 'imagine',
        data: {
          sd_prompt: 'abstract cognitive visualization',
          dominant_metaphor: 'fragmented pathways',
          emotional_temperature: 'electric',
          image_url: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 50)}`,
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
