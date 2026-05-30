# claude.imbila.ai — Claude Academy

AI Fluency curriculum (the **4D Framework** — Delegation, Description, Discernment, Diligence — by Prof. Joseph Feller & Prof. Rick Dakan with Anthropic) delivered as an interactive, self-paced course with an AI tutor and auto-generated quizzes.

Part of the Imbila.AI academy family alongside [`google.imbila.ai`](https://github.com/imbilawork/google.imbila.ai) and [`openai.imbila.ai`](https://github.com/imbilawork/openai.imbila.ai). Deployed to Cloudflare Pages as project **`claude-academy`** → https://claude.imbila.ai.

## Architecture

Cloudflare Pages (static) + Pages Functions, powered entirely by **Cloudflare Workers AI** (edge inference — no external model APIs/keys):

```
public/index.html          Landing page
public/learn.html          10-module course UI (progress in localStorage)
functions/api/_middleware.ts   Per-IP rate limiting + CORS
functions/api/tutor.ts         AI tutor (SSE streaming) — @cf/meta/llama-3.3-70b-instruct-fp8-fast
functions/api/assess.ts        Quiz generator (JSON) — @cf/meta/llama-3.1-8b-instruct
wrangler.toml              project=claude-academy, ACADEMY=claude, [ai] binding
```

Access is **open** — all 10 modules, the AI tutor and quizzes are free, no sign-in.

## Develop & deploy

```bash
npx wrangler pages dev          # local (needs Workers AI; use --remote for the AI binding)
npx wrangler pages deploy --project-name=claude-academy
```

> Reconstructed from the live deployment in May 2026 (the original direct-upload source had no repo). Curriculum content lives in the `MODULES` array in `public/learn.html`.
