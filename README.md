````markdown
<div align="center">

# `SBD://` Second Brain Debugger

*Because your biological neural network is throwing unhandled exceptions.*

`v2.0.0` &nbsp;·&nbsp; `pipeline: armed` &nbsp;·&nbsp; `multimodal: enabled`

[![Live Demo](https://img.shields.io/badge/live_demo-00ff88?style=flat-square&logoColor=black)](https://second-brain-debugger-2a6a0mm6a-thanos1434xd-7688s-projects.vercel.app)
&nbsp;
[![Next.js](https://img.shields.io/badge/next.js_14-0a0a0a?style=flat-square)](https://nextjs.org)

</div>

---

## 📡 The Multimodal Upgrade (v2.0)

Your thoughts aren't just text. Now, the debugger isn't either.

- **📸 Vision Extraction (Gemma-3):** Drop a screenshot of your notes, a photo of your messy journal, or a Notion page. The system extracts the "raw thought dump" directly from the pixels.
- **🎤 Voice Input (Whisper):** Speak your mind. Perfect for 2 AM realizations where typing is just too much friction.
- **🎨 Latent Space Imaging (SD v1.5):** After processing your conflicts, the pipeline samples the latent space to generate a unique generative art piece representing your current mental state.
- **🔊 Voice Synthesis (Kokoro-82m):** Hear your core truth spoken back to you in a calm, direct, cognitive-feedback voice.

---

## 🚨 The Incident Report

It's 2 AM. You open a notes app and type something like:

> *i want to build something meaningful but i keep procrastinating and maybe im
just not built for this and also i have 47 tabs open and three half-finished
projects and i told myself this year would be different but its april and—*

Your notes app goes: *"Saved. ✨"*  
Your therapist goes: *"Mmm. And how does that make you feel?"*  
Your brain goes: *[SEGMENTATION FAULT]*

**Second Brain Debugger goes:** Hold on. Let me run that through the pipeline.

Six stages. Real AI. Your actual thoughts—parsed, structured, conflict-detected, clarified, actioned, and reflected back at you like a senior engineer just code-reviewed your brain's pull request. 

No affirmations. No breathing exercises. Just a stack trace of your own mind—and a patch.

---

## ⚙️ How The Pipeline Works

> *Each stage feeds the next. Stage 5 doesn't generate generic actions—it generates actions specific to **your** conflicts from Stage 3. This is contextual chaining. Your thoughts aren't just processed. They're compiled.*

```text
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

Everything streams live over SSE. You don't wait for results. You watch your brain get analyzed in real time—stage by stage—like a compiler running passes on your own cognition.

---

## 🛠️ The Stack

```javascript
const SBD = {
  framework:   "Next.js 14 (App Router) + TypeScript",
  styling:     "Tailwind CSS + Custom Design Tokens",
                // yes, both. it made sense at 2am. it still makes sense.
  animations:  [
    "Framer Motion",          // smooth UI transitions
    "Canvas API",             // Matrix-style token rain background
    "SVG Neural Edges",       // paths connecting cards with live weights (w: 0.84)
  ],
  ai: {
    provider:     "Oxlo API",
    fast_model:   "mistral-7b",      // Cognitive atomization (fast & streaming)
    strong_model: "mistral-7b",      // Scaled for stability
    multimodal:   [
      "gemma-3-4b (vision)", 
      "kokoro-82m (tts)", 
      "stable-diffusion-v1-5 (imaging)"
    ]
  },
  validation:  "Zod — every stage, every response, no exceptions",
  state:       "useReducer state machine",
               // idle → parsing → structuring → detecting →
               // clarifying → planning → reflecting → done
  runtime:     "Vercel Edge",      // because cold starts are the enemy
  streaming:   "SSE end-to-end",   // see it as it thinks
}
```

---

## 🚀 Running It Locally

```bash
git clone https://github.com/TryingtobeingNikhil/Second-Brain-Debugger
cd Second-Brain-Debugger
npm install
```

Set up your environment variables:
```env
# .env.local — Connect to the Oxlo Brain
OXLO_API_KEY=your_oxlo_api_key_here
OXLO_BASE_URL=https://api.oxlo.ai/v1

# Text Models
OXLO_FAST_MODEL=mistral-7b
OXLO_STRONG_MODEL=mistral-7b

# Multimodal Outlets
OXLO_VISION_MODEL=gemma-3-4b
OXLO_SD_MODEL=stable-diffusion-v1-5
OXLO_TTS_MODEL=kokoro-82m
```

Fire up the pipeline:
```bash
npm run dev
# → Booting on localhost:3000
```

Open it. Type something you've been avoiding thinking about. Or drop an image of your scattered notes. See what the pipeline finds.

---

## 📂 Project Architecture

```text
app/
├── api/analyze/
│   ├── parse/        ← Stage 1: Strips the noise (fast model)
│   ├── structure/    ← Stage 2: Builds the dependency graph
│   ├── conflicts/    ← Stage 3: Finds where you contradict yourself
│   ├── clarity/      ← Stage 4: Pulls out the unvarnished truth
│   ├── actions/      ← Stage 5: What you actually need to do next
│   └── reflect/      ← Stage 6: Questions you didn't know to ask
├── api/pipeline/
│   ├── imagine/      ← Stage 7: Sampling latent space visual metaphors
│   └── speak/        ← Stage 8: Cognitive audio feedback synthesis
└── page.tsx          ← The terminal. Where it all happens.

components/
├── ImagineNode.tsx   ← Abstract art visualization
├── SpeakNode.tsx     ← Audio feedback interface
├── MicButton.tsx     ← Voice dumping trigger
└── ui/
    └── PipelineTracker.tsx ← Always visible. Always tracking.

lib/ai/
├── pipeline.ts       ← AsyncGenerator. The central nervous system.
├── schemas.ts        ← Zod contracts locking down stage inputs & outputs.
└── retry.ts          ← Rate limit handling + exponential backoff resilience.
```

---

## 📜 License

MIT.

Your thoughts are yours. The debugger is free. The existential crisis is complimentary.

---

<div align="center">

```text
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

*Built with too much coffee and just enough clarity.*

</div>
````
