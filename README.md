# Radical Rest — Site 83

Burnout recovery, anti-hustle culture, the science of doing nothing.
The Oracle Lover, in her Radical Rest archetype.

## Stack

- **Server:** Express (with WWW→apex 301 redirect at the very first middleware)
- **SSR:** Vite + React 18 (renderToString)
- **Data:** SQLite via better-sqlite3 (file: `data/radical-rest.db`)
- **Writing engine:** DeepSeek (OpenAI client → `https://api.deepseek.com`, model `deepseek-chat` primary, `deepseek-v4-pro` fallback)
- **Crons:** node-cron (in-process). No external scheduler.
- **Images:** Bunny CDN only. The repo carries exactly one image (`public/favicon.svg`); every other image lives at `https://radical-rest-pull.b-cdn.net/...` as compressed WebP.
- **Email:** Nodemailer only.

## Quality gate

Every article must, before insert:

- be ≥1,500 words (target 1,800–2,400)
- carry a TL;DR, byline (The Oracle Lover with link), datetime, hero image
- have ≥3 internal links to other Radical Rest articles
- have ≥1 external authoritative link (academic or government source)
- have 3 or 4 Amazon affiliate links (verified ASINs)
- contain at least one self-referencing line ("I write about this regularly...")
- pass the union of every banned word/phrase list (master scope §12A + addendum)
- pass the em-dash sanitizer (no `—` in body prose)

The gate logs every pass and fail to `cron_log` and `gate_log`.

## Crons

| Job | Schedule (UTC) | Purpose |
|-----|----------------|---------|
| daily-generation × 5 | `5 9,11,13,15,17 * * 1-5` | 5 articles per weekday, one per slot |
| refresh-daily | `0 3 * * *` | re-runs the gate on 1 article older than 30d |
| refresh-weekly | `0 4 * * 0` | deep refresh of 5 oldest articles (>90d) |
| reverify-asins | `0 2 * * 1` | re-checks every Amazon ASIN |

A first-boot top-up loop runs a generation every 4 minutes if `countPublishedArticles() < 30` — so a fresh deploy fills to the floor on its own.

## Environment

The application reads exactly five env vars:

```
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-v4-pro
AUTO_GEN_ENABLED=true
PORT=3000
```

Anything else the spec mentions is handled in code with safe defaults.

## Run

```
pnpm install
pnpm build
pnpm start
```

## Add domain + Bunny later

Two surface-level changes:

- `src/lib/site-config.mjs` → `SITE.origin` is the apex URL.
- `src/data/hero-images.mjs` → `BUNNY_BASE` is the Bunny CDN base URL.

Everything else is wired off these constants.
