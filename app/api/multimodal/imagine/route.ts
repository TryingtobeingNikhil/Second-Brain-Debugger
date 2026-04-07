import { NextRequest } from 'next/server'
import { createSSEStream, sseHeaders } from '@/lib/ai/stream'
import { PROMPTS, MODELS, OXLO_BASE_URL } from '@/lib/ai/prompts'
import { ImagineSchema } from '@/lib/ai/schemas'
import { withRetry } from '@/lib/ai/retry'
import { parseStreamingJSON } from '@/lib/ai/parser'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  if (!process.env.OXLO_API_KEY) {
    return Response.json({ error: 'Missing API key' }, { status: 500 })
  }

  const body = await req.json()
  const { previousStages } = body

  if (!previousStages?.conflicts) {
    return Response.json(
      { error: 'Conflicts stage required before image generation' },
      { status: 400 }
    )
  }

  const { readable, send, close } = createSSEStream()

  ;(async () => {
    try {
      send({ type: 'stage_start', stage: 'imagine' })

      // Step 1: Use LLM to build the SD prompt from conflict data
      const promptResult = await withRetry(async (signal) => {
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
              { role: 'system', content: PROMPTS.imagine },
              {
                role: 'user',
                content: `Cognitive analysis:\n${JSON.stringify(previousStages, null, 2)}\n\nBuild the visual prompt for this mind.`,
              },
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

      // Step 2: Call Stable Diffusion with the generated prompt
      const sdResponse = await fetch(`${OXLO_BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OXLO_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODELS.imagine, // stable-diffusion-v1-5
          prompt: sdData?.sd_prompt || 'abstract neural network dark background hacker green',
          negative_prompt: sdData?.negative_prompt || 'faces, people, text',
          n: 1,
          size: '512x512',
          response_format: 'b64_json',
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
          image_url: imageData ? `data:image/png;base64,${imageData}` : null,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image generation failed'
      send({ type: 'error', stage: 'imagine', message })
    } finally {
      close()
    }
  })()

  return new Response(readable, { headers: sseHeaders() })
}
