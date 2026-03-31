# 🧠 Second Brain Debugger (SBD)

> "Because your biological neural network is throwing unhandled exceptions."

Let's be real: our brains are terrible at parsing 10 things at once. We get anxious, we procrastinate, we stare at a blinking cursor, and eventually end up watching 3 hours of YouTube essays on movies we haven't even seen. 

**Second Brain Debugger** is a tool I built to literally debug my own thoughts. Instead of treating your brain like a mystical black box, this app treats it like a piece of legacy software with a memory leak. You dump your messy, unstructured anxieties into it, and it runs a strict 6-stage cognitive AI pipeline to hand you the "stack trace" of your emotions.

## 🚀 What it actually does

You write a raw thought like: *"I really want to build this project but I feel like I'm not smart enough so I'm just playing video games."*

SBD takes that and passes it through the AI pipeline:
1. **[PARSE]**: Extracts atomic thoughts so we can look at the pieces.
2. **[STRUCTURE]**: Figures out how they actually connect.
3. **[CONFLICTS]**: Detects the core cognitive dissonance (e.g., "Ambition vs. Imposter Syndrome").
4. **[CLARITY]**: Spits out the harsh, underlying truth you're actively avoiding.
5. **[ACTIONS]**: Generates a concrete, stupidly-simple task list to unblock you.
6. **[REFLECT]**: Leaves you with an existential question to ponder while you stare at the ceiling.

## 🛠️ The Tech Stack (How the sausage is made)

This isn't just a generic ChatGPT wrapper. I over-engineered the hell out of this because why not?

*   **Frontend:** Next.js (App Router), React, and raw Canvas API. No bloated animation libraries here—just pure, unadulterated `requestAnimationFrame` and Math.random() to make it feel alive.
*   **The Aesthetic:** "What if the NSA built a mindfulness app?" Brutalist, hacker-green terminal vibes, tracking your thought weights with live SVG edge connections.
*   **Backend / AI:** Custom Edge API routes streaming partial JSON chunks natively. Uses strict Zod schema validation because LLMs are chaos engines that occasionally forget how JSON works.
*   **LLM Provider:** [Oxlo API](https://oxlo.ai) (Fast and smart enough to call me out on my BS).

## 💻 How to run it locally

Want to debug your own brain?

1. Clone this bad boy.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory and add your Oxlo API key:
   ```env
   OXLO_API_KEY=your_api_key_here
   ```
4. Boot up the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) and prepare to feel deeply perceived by a machine.

## 🤝 Contributing

Found a bug? Have an idea to make the AI even more painfully accurate? PRs are always welcome! 

*(Just please don't break the token rain canvas animation, it took me entirely too long to get the math right.)*

## 📜 License

MIT License. Do whatever you want with it, just don't use it to automate therapy.
