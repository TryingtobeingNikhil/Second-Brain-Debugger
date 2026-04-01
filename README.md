# SECOND BRAIN DEBUGGER
### `v1.0.0-cognitive-release`

```
> Initializing thought process...
> Warning: Unhandled exceptions detected in biological neural network
> Recommendation: Run debugger immediately
> Estimated clarity: 12%
> Starting SBD...
```

---

**Your brain is running legacy code. We're here to ship the patch.**

Second Brain Debugger is what happens when you stop journaling and start *debugging*. It takes the unstructured soup of anxiety, ambition, and 3am thoughts you typed into a box — and runs it through a 6-stage AI pipeline that treats your cognition like a production system that just threw a 500.

No affirmations. No "have you tried breathing?" Just stack traces, conflict reports, and actionable patches.

**Live → [your-deployment-url.vercel.app](https://your-deployment-url)**

---

## The Problem

Your thoughts don't come structured. They come as one long, unpunctuated, emotionally charged blob at 2am. Something like:

```
i want to build something great but what if im not good enough and also 
i havent shipped anything in 3 weeks and my todo list has 47 items and 
i keep adding to it instead of doing the things and maybe i should just—
```

A therapist would nod. A journaling app would save it.

**SBD runs it through six stages of AI inference and hands you a diff.**

---

## The Pipeline

Six stages. Sequential. Non-negotiable. Each one feeds the next like a compiler pass — because you wouldn't ship code that skips type-checking, and you shouldn't process thoughts that skip conflict detection.

```
╔══════════════════════════════════════════════════════════╗
║  RAW INPUT  →  [PARSE]  →  [STRUCTURE]  →  [CONFLICTS]  ║
║             →  [CLARITY]  →  [ACTIONS]  →  [REFLECT]    ║
╚══════════════════════════════════════════════════════════╝
```

| Stage | Codename | What's actually happening |
|-------|----------|--------------------------|
| `01` | **PARSE** | Extracts atomic thoughts from your wall of text. Noise cancelled. Signal kept. |
| `02` | **STRUCTURE** | Maps the hidden dependencies between thoughts. Builds the graph your brain refused to. |
| `03` | **CONFLICTS** | Detects cognitive dissonance. Scores it. Names it. *"Ambition vs. Imposter Syndrome — severity: 0.87"* |
| `04` | **CLARITY** | Distills the core truth. Also surfaces what you're actively avoiding. Uncomfortable? Good. |
| `05` | **ACTIONS** | Generates a concrete, low-energy task list. One step. Then another. No 47-item todo lists. |
| `06` | **REFLECT** | Fires existential queries based on your latent space. The part that makes you stare at the ceiling. |

Everything streams. Every stage updates live over SSE. You don't wait — you *watch* your brain get debugged in real time.

---

## Stack

```
Framework   →  Next.js 14 (App Router) + TypeScript
Styling     →  Tailwind CSS + custom design tokens (yes, both. it made sense at 2am.)
Animations  →  Framer Motion + Canvas API (Matrix-style Token Rain bg) + SVG Neural Edges
AI          →  Oxlo API — mistral-7b (fast parse) + mixtral-8x7b (deep reasoning)
Validation  →  Zod — every stage, every response, no exceptions
State       →  useReducer state machine: idle → parsing → structuring → ... → done
Deployment  →  Vercel Edge Runtime
```

---

## Design System: *NSA Meets Notion*

Brutalist. Terminal. Hacker-green. Minimalist — but only because every pixel that survived earned its place.

```css
--bg:       #0a0a0a;      /* void */
--accent:   #00ff88;      /* hacker green. the only color that matters. */
--border:   1px dashed rgba(0, 255, 136, 0.3);
--font:     'JetBrains Mono', monospace; /* all AI output, always */
```

**Key UI components:**

- **`EEGOscilloscope`** — A live brainwave monitor tied to model loss convergence. It moves because the model is thinking, not for decoration.
- **`AttentionHeatmap`** — The input area dynamically highlights high-attention keywords *as you type*. You see what the model will focus on before it does.
- **`NeuralEdges`** — SVG paths connect the UI cards. They display live weights (`w: 0.84`) and fire backprop animations when conflicts are detected.
- **`ModelCard`** — The final output is presented as an ML inference report, not a summary. Because that's what it is.

---

## Project Structure

```
app/
  api/
    analyze/
      parse/        — Stage 1: fast model, edge runtime
      structure/    — Stage 2: deep reasoning begins
      conflicts/    — Stage 3: where it gets uncomfortable
      clarity/      — Stage 4: the honest part
      actions/      — Stage 5: what you actually do next
      reflect/      — Stage 6: the existential closer
  page.tsx          — where the terminal lives

components/
  ui/
    CognitiveFingerprint.tsx   — unique thought signature per session
    PipelineTracker.tsx        — always visible. never hides.
    ActionStep.tsx             — one patch at a time
    EEGOscilloscope.tsx        — the brain is working
    AttentionHeatmap.tsx       — the brain is watching

lib/
  ai/
    parser.ts     — safeParseJSON + stream parsing
    stream.ts     — SSE helpers
    retry.ts      — withRetry, 2 attempts, 30s timeout
    schemas.ts    — Zod schemas for all 6 stages
    prompts.ts    — system prompts + model config
    pipeline.ts   — AsyncGenerator. the spine of everything.
  types/
    index.ts      — StageResult, StreamEvent, the contracts
  validation.ts   — sanitize input, cap at 5000 chars
  observability.ts — knows when things are about to go wrong

middleware.ts     — rate limit: 10 req/min per IP. be reasonable.
```

---

## Running Locally

```bash
git clone https://github.com/[your-username]/second-brain-debugger
cd second-brain-debugger
npm install
```

```env
# .env.local
OXLO_API_KEY=your_key_here
OXLO_BASE_URL=https://api.oxlo.ai/v1
OXLO_FAST_MODEL=mistral-7b
OXLO_STRONG_MODEL=mixtral-8x7b
```

```bash
npm run dev
```

Open `localhost:3000`. Type something you've been avoiding thinking about. See what happens.

---

## Architecture Notes

A few decisions worth explaining, because "why'd you do it that way" is a fair question:

**Why 6 separate API routes instead of one big prompt?**
Because each stage needs to reason on top of the previous one's *validated* output. Merging them into a single call means you lose the guarantee that Stage 3 is actually working with clean, schema-validated data from Stage 2. The pipeline is strict by design.

**Why Edge Runtime?**
Latency. The first character of output should appear fast. Edge cuts the cold start. With SSE streaming, the user sees Stage 1 results before Stage 2 has even started.

**Why Zod on every stage?**
Because LLMs hallucinate structure. Zod catches it. `safeParseJSON` with a graceful fallback means the UI never breaks — it degrades cleanly. The demo never crashes. (Famous last words, but also literally enforced in code.)

**Why `useReducer` for state?**
Six stages, eight possible states, streaming updates, error recovery. `useState` would've been a crime scene. The state machine makes the lifecycle explicit and debuggable. Fitting, for a debugger.

---

## The Impact Moment

After Stage 4 (Clarity), there's a 900ms pause before the output renders.

That's not a bug or a slow API. It's intentional. The silence before the thing that's actually true lands harder than if it just appeared instantly. The `triggerImpactMoment()` function fires once — guarded by a `useRef` — and the typewriter effect handles the rest.

Some UX decisions are about milliseconds. This one is.

---

## License

MIT — debug freely.

---

```
> Session complete.
> Conflicts resolved: 3
> Actions generated: 5
> Existential questions remaining: ∞
>
> Your biological neural network is still running legacy code.
> But at least now you have the stack trace.
```
