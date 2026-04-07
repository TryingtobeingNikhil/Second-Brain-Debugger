<div align="center">

# `SBD://` Second Brain Debugger

*because your biological neural network is throwing unhandled exceptions*

`v2.0.0` &nbsp;·&nbsp; `pipeline: armed` &nbsp;·&nbsp; `multimodal: enabled`

[![Live Demo](https://img.shields.io/badge/live_demo-00ff88?style=flat-square&logoColor=black)](https://second-brain-debugger-2a6a0mm6a-thanos1434xd-7688s-projects.vercel.app)
&nbsp;
[![Next.js](https://img.shields.io/badge/next.js_14-0a0a0a?style=flat-square)](https://nextjs.org)
&nbsp;

</div>

---

## 📡 The Multimodal Upgrade (v2.0)

Your thoughts aren't just text. Now, the debugger isn't either.

- **📸 Vision Extraction (Gemma-3):** Drop a screenshot of your notes, a photo of your messy journal, or a Notion page. The system extracts the "raw thought dump" directly from the pixels.
- **🎤 Voice Input (Whisper):** Speak your mind. Perfect for 2am realizations where typing is too much friction.
- **🎨 Latent Space Imaging (SD):** After processing your conflicts, the pipeline samples the latent space to generate a unique generative art piece representing your current mental state.
- **🔊 Voice Synthesis (Kokoro-82m):** Hear your core truth spoken back to you in a calm, direct cognitive-feedback voice.

---

## The Incident Report

It's 2am. You open a notes app and type something like:

```
i want to build something meaningful but i keep procrastinating and maybe im
just not built for this and also i have 47 tabs open and three half-finished
projects and i told myself this year would be different but its april and—
```

Your notes app goes: *"Saved. ✨"*

Your therapist goes: *"Mmm. And how does that make you feel?"*

Your brain goes: *[SEGMENTATION FAULT]*

**Second Brain Debugger goes:** hold on. let me run that through the pipeline.

Six stages. Real AI. Your actual thoughts — parsed, structured, conflict-detected, clarified, actioned, and reflected back at you like a senior engineer just reviewed your brain's pull request.

No affirmations. No breathing exercises. Just a stack trace of your own mind — and a patch.

---

## How The Pipeline Works

> *Each stage feeds the next. Stage 5 doesn't generate generic actions — it generates actions specific to **your** conflicts from Stage 3. This is contextual chaining. Your thoughts aren't processed. They're compiled.*

```
                    YOUR BRAIN (legacy, poorly documented)
                               │
                               ▼
              ┌────────────────────────────────┐
              │  [01] PARSE                    │
              │  Input: raw stream of anxiety  │
              │  Output: atomic thoughts       │
              │  Model: mistral-7b (fast)      │
              └──────────────┬─────────────────┘
                             │  clean signal
                             ▼
              ┌────────────────────────────────┐
              │  [02] STRUCTURE                │
              │  Builds the dependency graph   │
              │  your brain refused to make    │
              └──────────────┬─────────────────┘
                             │  relationships mapped
                             ▼
              ┌────────────────────────────────┐
              │  [03] CONFLICTS          ⚠️    │
              │  Detects cognitive dissonance  │
              │  Scores it. Names it. Ouch.    │
              │  e.g. "Ambition vs. Imposter   │
              │  Syndrome — severity: 0.87"    │
              └──────────────┬─────────────────┘
                             │  [900ms tension pause]
                             ▼
              ┌────────────────────────────────┐
              │  [04] CLARITY            💡    │
              │  Distills the core truth.      │
              │  Also: what you're avoiding.   │
              │  The uncomfortable part.       │
              └──────────────┬─────────────────┘
                             │  typewriter effect kicks in
                             ▼
              ┌────────────────────────────────┐
              │  [05] ACTIONS                  │
              │  Concrete. Low-energy. Linked  │
              │  to YOUR specific conflicts.   │
              │  Not a 47-item todo list.      │
              └──────────────┬─────────────────┘
                             │
                             ▼
              ┌────────────────────────────────┐
              │  [06] REFLECT            🌀    │
              │  Existential queries based on  │
              │  your latent space analysis.   │
              │  The part that hits different  │
              │  at 2am. You've been warned.   │
              └──────────────┬─────────────────┘
                             │
                             ▼
                    YOU, BUT DEBUGGED
```

Everything streams live over SSE. You don't wait for results. You watch your brain get analyzed in real time — stage by stage — like a compiler running passes on your own cognition.

---

## The Stack

```js
const SBD = {
  framework:   "Next.js 14 (App Router) + TypeScript",
  styling:     "Tailwind CSS + custom design tokens",
                // yes, both. it made sense at 2am. it still makes sense.
  animations:  [
    "Framer Motion",          // UI transitions
    "Canvas API",             // Matrix-style Token Rain background
    "SVG Neural Edges",       // paths connecting cards with live weights (w: 0.84)
  ],
  ai: {
    provider:     "Oxlo API",
    fast_model:   "mistral-7b",      // Cognitive atomization
    strong_model: "mistral-7b",      // Scaled for stability vs deepseek-v3
    multimodal:   ["gemma-3 (vision)", "kokoro (tts)", "stable-diffusion"]
  },
  validation:  "Zod — every stage, every response, no exceptions",
  state:       "useReducer state machine",
               // idle → parsing → structuring → detecting →
               // clarifying → planning → reflecting → done
  runtime:     "Vercel Edge",      // cold starts are the enemy
  streaming:   "SSE end-to-end",   // you see it as it thinks
}
```

---

## Running It Locally

```bash
git clone https://github.com/TryingtobeingNikhil/Second-Brain-Debugger
cd Second-Brain-Debugger
npm install
```

```env
# .env.local — setup your Oxlo credentials
OXLO_API_KEY=your_key_here
OXLO_BASE_URL=https://api.oxlo.ai/v1
OXLO_FAST_MODEL=mistral-7b
OXLO_STRONG_MODEL=mistral-7b

# Multimodal endpoints
OXLO_VISION_MODEL=gemma-3-4b
OXLO_SD_MODEL=stable-diffusion-v1-5
OXLO_TTS_MODEL=kokoro-82m
```

```bash
npm run dev
# → localhost:3000
```

Open it. Type something you've been avoiding thinking about. Or drop an image.

See what the pipeline finds.

---

## Project Structure

```
app/
  api/analyze/
    parse/        ← Stage 1: fast model, strips the noise
    structure/    ← Stage 2: builds the dependency graph
    conflicts/    ← Stage 3: finds where you contradict yourself
    clarity/      ← Stage 4: the honest part
    actions/      ← Stage 5: what you actually do next
    reflect/      ← Stage 6: questions you didn't know to ask
  api/pipeline/   
    imagine/      ← Stage 7: Sampling latent space visual metaphors
    speak/        ← Stage 8: Waveform synthesis
  page.tsx        ← the terminal. where it all happens.

components/
  ImagineNode.tsx    ← Abstract art visualization
  SpeakNode.tsx      ← Audio feedback interface
  MicButton.tsx      ← Voice dumping trigger
  ui/
    PipelineTracker.tsx ← always visible. always watching.

lib/ai/
  pipeline.ts   ← AsyncGenerator. the spine of everything.
  schemas.ts    ← Zod contracts for all stages
  retry.ts      ← withRetry: Handling 429 rate limits + exponential backoff
```

---

## License

MIT.

Your thoughts are yours. The debugger is free. The existential crisis is complimentary.

---

<div align="center">

```
> session complete
> conflicts resolved:          3
> actions generated:           5  
> existential questions:       ∞
> biological neural network:   still running legacy code
>
> but at least now you have the stack trace.
>
> — SBD v2.0.0
```

*built with too much coffee and just enough clarity*

</div>
