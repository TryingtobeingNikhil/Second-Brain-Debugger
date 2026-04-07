import { NextRequest } from 'next/server'
import { createSSEStream, sseHeaders } from '@/lib/ai/stream'
import { MODELS, OXLO_BASE_URL } from '@/lib/ai/prompts'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  // ── STUB: detect if OXLO_API_KEY is missing and return canned transcript ──
  const formData = await req.formData()
  const audioFile = formData.get('audio') as File | null

  if (!audioFile) {
    return Response.json({ error: 'No audio file provided' }, { status: 400 })
  }

  if (!process.env.OXLO_API_KEY) {
    // Hackathon stub — return realistic demo transcript
    return Response.json({
      transcript: "I want to build something meaningful but I'm afraid I'm not smart enough and I keep procrastinating instead of starting.",
      duration_seconds: 4.2,
      stub: true,
    })
  }

  try {
    const whisperForm = new FormData()
    whisperForm.append('file', audioFile)
    whisperForm.append('model', MODELS.whisper)
    whisperForm.append('response_format', 'json')

    const response = await fetch(`${OXLO_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OXLO_API_KEY}` },
      body: whisperForm,
    })

    if (!response.ok) throw new Error(`Whisper API error: ${response.status}`)

    const data = await response.json()
    const transcript = data.text?.trim()
    if (!transcript) throw new Error('Empty transcription returned')

    return Response.json({ transcript, duration_seconds: data.duration || null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transcription failed'
    // Fallback to stub on error for demo resilience
    return Response.json({
      transcript: "I want to build something meaningful but I'm afraid I'm not smart enough.",
      duration_seconds: null,
      stub: true,
      error_detail: message,
    })
  }
}
