# ResumeCV

Score your resume in seconds. Upload a PDF or DOCX, optionally paste a job description, and get a 0-100 score with a category breakdown, prioritized fixes, keyword gaps and AI feedback on your weakest bullets.

The score measures resume **form and keyword fit** (structure, clarity, measurable impact, and match to a job description). It is not a judgement of you as a candidate.

## Features

- **Resume scoring** from a PDF or DOCX, parsed entirely in the browser.
- **Tailored mode.** Paste a job description (30+ words) and the score adds keyword match and title alignment, with matched and missing keywords shown as chips.
- **Prioritized fixes.** Every lost point is explained, and the top fixes show how many points they are worth.
- **AI feedback.** Bullet ratings (1-5), rewrites that reuse only your own facts, a short summary, strengths and gaps, and a job-fit assessment.
- **History.** Past analyses are saved in your browser (localStorage) with a score trend. Resume text is never stored.
- **Templates.** Six ATS-friendly DOCX templates (Software Engineer, Data Analyst, Product Manager, Marketing, Fresher, Career-changer), each paired with a sample job description.
- **Graceful fallback.** If the AI service is slow or down, you still get the full rule-based score, with a retry button.

## How scoring works

The score is a hybrid. Rules produce 75 points and are deterministic, so the same resume always gets the same rule score. AI judgments add up to 25 points, constrained to a fixed rubric at temperature 0. The final total is scaled to 100.

**Without a job description**

| Category | Points | Source |
|---|---|---|
| Quantified impact | 19 | Rules |
| Action verbs and clarity | 15 | Rules |
| Structure and sections | 15 | Rules |
| ATS-friendliness | 11 | Rules |
| Length and density | 8 | Rules |
| Skills section | 7 | Rules |
| Bullet quality | 25 | AI |

**With a job description**

| Category | Points | Source |
|---|---|---|
| Keyword match | 26 | Rules (terms extracted by AI) |
| Title alignment | 8 | Rules |
| Quantified impact | 11 | Rules |
| Action verbs and clarity | 8 | Rules |
| Structure and sections | 8 | Rules |
| ATS-friendliness | 7 | Rules |
| Length and density | 4 | Rules |
| Skills section | 3 | Rules |
| Bullet quality | 15 | AI |
| Skills demonstrated | 10 | AI |

If the AI part is unavailable, the score is computed from the rule points alone and scaled to 100.

**Safeguards**

- The AI only returns structured JSON, validated with `zod`. The app does the arithmetic.
- Resume and job description text is treated as untrusted data in the prompts, which limits prompt injection. The AI share of the score is bounded.
- A deterministic check discards any rewrite that contains numbers not present in the original bullet.

## Privacy

- Files are parsed in the browser. The raw file never reaches the server.
- Before anything is sent to the AI, the text is redacted in the browser: email, phone, links, address lines, PIN codes and the name line (first line of the resume) are replaced with placeholders such as `[EMAIL]`.
- Redaction is best-effort. A name inside a paragraph or an unusual address format can slip through.
- The redacted text and bullets are sent to **Google's Gemini API**. On the free tier, Google's terms allow prompts and responses to be used to improve their products. Check the current terms for your tier before using this with real resumes.
- History stores scores, category breakdowns, fixes, keywords and the AI summary in `localStorage`. It does not store resume text, bullets or rewrites.
- Server logs contain error messages only, never resume content.
- AI answers are cached (Redis in production) for 24 hours, keyed by a hash of the input. The cached feedback itself is readable by whoever has access to your Redis console.

## Tech stack

- Next.js 16 (App Router, Turbopack, Cache Components enabled), React, TypeScript
- Tailwind CSS, lucide-react
- `pdfjs-dist` and `mammoth` for parsing
- `@google/genai` (Gemini) and `zod` for validated AI output
- `@upstash/redis` for cache and rate limits in production
- `docx` and `tsx` to generate the template files

## Getting started

### Prerequisites

- Node.js 20 or newer
- A Gemini API key from [Google AI Studio](https://aistudio.google.com)

### Install and run

```bash
git clone <your-repo-url>
cd resumecv
npm install
cp .env.example .env.local     # on Windows PowerShell: Copy-Item .env.example .env.local
```

Fill in `.env.local` (see below), then:

```bash
npm run dev
```

Open http://localhost:3000. Restart the dev server after any change to `.env.local`.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Your Gemini API key. Server-side only. Never prefix it with `NEXT_PUBLIC_`. |
| `GEMINI_MODEL` | Yes | Exact model ID from AI Studio. Used for job description extraction and as the default for resume review. |
| `GEMINI_RESUME_MODEL` | No | A separate model for resume review. Handy if the default model is a lightweight one. |
| `GEMINI_FALLBACK_MODEL` | No | Tried when the main model keeps failing (overload, rate limit, timeout). |
| `GEMINI_TIMEOUT_MS` | No | Per-attempt timeout. Defaults to 25000. |
| `RATE_LIMIT_PER_HOUR` | No | AI calls allowed per IP per hour. Defaults to 20. |
| `GLOBAL_DAILY_CAP` | No | Total AI calls allowed per day. Defaults to 300. Set it below your provider's daily quota. |
| `UPSTASH_REDIS_REST_URL` | Production | Redis REST URL. `KV_REST_API_URL` is also accepted. |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Redis REST token. `KV_REST_API_TOKEN` is also accepted. |

Without the Redis variables, the cache and rate limiter fall back to in-memory, which is fine for local development but resets on serverless cold starts.

Never commit `.env.local`. If a key is ever exposed, revoke it in AI Studio and create a new one.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build (also type-checks) |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run build:templates` | Regenerate the DOCX files in `public/templates/` from `src/lib/templates/data.ts` |

## Project structure

```
src/
  app/
    page.tsx                    Landing page
    (app)/                      Pages that show the sidebar
      analyze/                  Upload and job description input
      results/                  Score, breakdown, fixes, AI feedback
      history/                  Saved analyses and trend
      templates/                Template gallery and detail view
    api/
      analyze-jd/route.ts       Job description to structured data
      analyze-resume/route.ts   Bullet ratings, rewrites, summary, job fit
  components/                   ScoreRing, CategoryBar, KeywordChips, AiPanel, Sidebar, ResumeDoc
  lib/
    parse/                      PDF/DOCX extraction, section detection, redaction
    scoring/                    Rule engine, weights, job description matching
    ai/                         Gemini client, prompts, zod schemas, browser API helpers
    server/                     Cache, rate limiting, Redis client
    templates/data.ts           Single source for template content and sample job descriptions
    history.ts                  localStorage history
scripts/build-templates.ts      DOCX generator
public/templates/               Generated DOCX templates
```

## API

Both endpoints are `POST`, accept JSON, and respond with `{ data, cached }` or `{ error, kind? }`.

**`/api/analyze-jd`**: body `{ jd: string }` (150 to 8000 characters). Returns the job title, seniority, years required, and required and preferred skills.

**`/api/analyze-resume`**: body `{ resumeText, bullets, jd? }`, with `resumeText` redacted by the client. Returns bullet ratings and rewrites, a summary, strengths, gaps and, when a job description is supplied, a job-fit assessment.

Each AI call counts against the per-IP and global limits. An analysis with a job description makes two calls.

## Deployment (Vercel)

1. Push the repo to GitHub and import it in Vercel.
2. Add the environment variables above for Production and Preview. Mark `GEMINI_API_KEY` as Sensitive, and set `GEMINI_TIMEOUT_MS` to about `15000`.
3. Add Upstash Redis from the project's Storage tab, or create a database at upstash.com and paste the REST URL and token.
4. Deploy. Variables only apply to new deployments, so redeploy after changing them.
5. Check that all six files in `public/templates/` are committed (`git ls-files public/templates`), and that `.env.local` is not.

After deploying, run a full analysis, confirm `cv:cache:*` and `cv:rl:*` keys appear in Redis, and test the rate limit by temporarily lowering `RATE_LIMIT_PER_HOUR`.

Vercel's Hobby plan is for personal, non-commercial use.

## Notes for contributors

- **Cache version.** The Redis cache persists across deploys. When you change a prompt or schema, bump `CACHE_VERSION` in `src/lib/server/cache.ts`, or old answers will keep being served.
- **Cache Components.** The project has `cacheComponents` enabled, so route files must not export segment config such as `runtime` or `dynamic`.
- **Templates.** Edit `src/lib/templates/data.ts`, then run `npm run build:templates`. The gallery preview and the DOCX files both read from that file. Keep templates single-column with standard headings, so they score well in the analyzer.
- **Calibration.** Category weights and thresholds live in `src/lib/scoring/index.ts`. The AI share is mapped in `withAi` (average rating of 1 to 4.5 maps to 0 to full points).

## Known limitations

- Scanned or image-only PDFs can't be read, because there is no OCR. The app shows a clear error.
- Multi-column PDFs can come out with columns interleaved, which can confuse section and bullet detection.
- The name is only redacted when it is the first line of the resume.
- Rule-based checks can't judge whether a bullet is truthful or relevant, and keyword matching can reward stuffing. The AI layer reduces this but doesn't eliminate it.
- The Gemini free tier has low and changing limits. The app retries, falls back to a second model and caps usage, but heavy traffic needs a paid tier.
- Reopening a saved analysis from History doesn't show the "Bullets to improve" section, because bullet text isn't stored.

## Roadmap

- Scoring presets for Fresher and Career-changer (different category weights)
- Content-Security-Policy headers, tested against the PDF.js worker
- Comparing history entries only against like-for-like analyses (with and without a job description)
- Optional OCR for scanned PDFs

## License

Add a license before making the repository public.