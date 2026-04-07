import { NextRequest } from 'next/server'
import { PROMPTS, MODELS, OXLO_BASE_URL } from '@/lib/ai/prompts'
import { VisionSchema } from '@/lib/ai/schemas'
import { withRetry } from '@/lib/ai/retry'
import { parseStreamingJSON } from '@/lib/ai/parser'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const imageFile = formData.get('image') as File | null

  if (!imageFile) {
    return Response.json({ error: 'No image provided' }, { status: 400 })
  }

  if (!process.env.OXLO_API_KEY) {
    // Hackathon stub — return realistic demo extracted text
    return Response.json({
      extracted_text: 'Extracted content from image: [visual context detected] — build MVP, stop overthinking, launch fast, iterate. Fear of failure circled in red. "Just start" underlined twice.',
      visual_mood: 'chaotic',
      confidence: 0.91,
      image_type: 'notes',
      stub: true,
    })
  }

  try {
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = imageFile.type || 'image/jpeg'

    const result = await withRetry(async (signal) => {
      const response = await fetch(`${OXLO_BASE_URL}/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OXLO_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODELS.vision,
          stream: true,
          messages: [
            { role: 'system', content: PROMPTS.vision },
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
                { type: 'text', text: 'Extract all cognitive content from this image.' },
              ],
            },
          ],
        }),
      })
      if (!response.ok) throw new Error(`Vision API error: ${response.status}`)
      let finalResult = null
      for await (const partial of parseStreamingJSON(response.body!)) {
        finalResult = partial
      }
      return finalResult
    })

    const validated = VisionSchema.safeParse(result)
    return Response.json(validated.success ? validated.data : result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Vision failed'
    return Response.json({
      extracted_text: 'Extracted content from image: [visual context detected]',
      visual_mood: 'chaotic',
      confidence: 0.7,
      image_type: 'other',
      stub: true,
      error_detail: message,
    })
  }
}
