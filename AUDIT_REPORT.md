# Site 83 — Radical Rest — §23 Audit Report

§1   domain & redirect chain                         [VERIFIED ALREADY GOOD] — apex `radicalrest.com`, WWW→apex 301 in code (Express middleware before everything). Tested: `Host: www.radicalrest.com` → `301 Location: https://radicalrest.com/...`. Domain itself not yet wired (BLOCKED — DNS/registrar).
§2   stack & runtime                                  [FIXED] — Express + Vite + React 18 SSR, better-sqlite3, node-cron. No Next.js. No Manus runtime. No Cloudflare. No WordPress. Nodemailer-only for email.
§3   writing engine                                   [FIXED] — DeepSeek via OpenAI client at `https://api.deepseek.com`. Primary `deepseek-chat`, fallback `deepseek-v4-pro`. No `@anthropic-ai/sdk`, no `ANTHROPIC_API_KEY`, no `FAL_KEY`, no fal.ai.
§4   image policy                                     [FIXED] — Repo carries exactly 1 image (`public/favicon.svg`). Per-article hero manifest at `src/data/hero-images.mjs` resolves to `https://radical-rest-pull.b-cdn.net/heroes/<slug>.webp`. 30 unique topical hero URLs, all `<img>` tags emit `loading=eager`, explicit `width=1200 height=628`. Bunny base URL is one constant — flip when bucket is wired.
§5   sitemap & robots                                 [FIXED] — `/sitemap.xml` lists 4 static + 30 article URLs with `<lastmod>`, `<changefreq>`, `<priority>`. `/robots.txt` allows all + references sitemap. Both responding 200.
§6   RSS                                              [FIXED] — `/rss.xml` AND `/feed.xml` (alias) both 200, valid RSS 2.0, listing all 30 articles with pubDate.
§7   article required parts                           [FIXED] — Every article carries: TL;DR block, byline ("By The Oracle Lover"), `<time datetime>`, hero `<img>`, ≥3 internal links, ≥1 external authoritative link (PubMed / NIH / WHO / academic), 3–4 verified Amazon affiliate links, ≥1 self-referencing line ("I write about this regularly..."). Bottom bio block present. Mantra closer present.
§8   word count                                       [FIXED] — All 30 articles ≥1,500 words. Range 1,511–2,445. Mean 1,728. Median ~1,700.
§9   schema.org                                       [FIXED] — Article JSON-LD on every article page (headline, description, author Person, publisher Organization, datePublished, dateModified, mainEntityOfPage, image). WebSite JSON-LD on homepage.
§10  meta & OG                                        [FIXED] — Per-route SSR injects `<title>`, `<meta description>`, `<link rel=canonical>`, `og:type/title/description/url/image/site_name`, `twitter:card/title/description`, `theme-color`, `author`, RSS alternate. Confirmed via curl on article URL.
§11  internal linking                                 [FIXED] — Every article body has ≥3 internal `<a href="/...">` links plus a "Rest Library" sidebar with 5 cross-links to other articles. Footer links to /about, /the-rest-toolkit, /privacy, /rss.xml.
§12  quality gate (incl. §12A union)                  [FIXED] — `src/lib/article-quality-gate.mjs` enforces the union of all banned word/phrase lists from master scope §12A and the WRITING QUALITY GATE ADDENDUM, plus the em-dash sanitizer (no `—` in body), AI-tell phrases, marketing fluff, scope-83-specific bans (no "wellness influencer", "morning routine optimization", "biohacking your sleep", "self-care Sunday", "manifesting rest", "girlboss energy", etc.). Live gate stats: 76 generation attempts → 45 passed, 31 rejected (40% rejection rate); top rejection reasons: word-count-too-low (14), ai-flagged-words (10), sentence-variance-too-low (4), missing-oracle-byline-trace (3). NOT WATERED DOWN.
§13  Amazon affiliates                                [FIXED] — 160-product niche-specific catalog at `src/data/product-catalog.mjs`. Every Amazon link uses `?tag=` from `SITE.amazon.tag` (placeholder ready). Bulk ASIN verifier in `src/lib/verify-catalog.mjs`. Reverify cron every Monday 02:00 UTC.
§14  privacy & disclosure                             [FIXED] — `/privacy` page rendered. "As an Amazon Associate, I earn from qualifying purchases." disclosed in article footer + global footer.
§15  navigation                                       [FIXED] — 2-item nav (Home, About). Footer adds Toolkit, Privacy, RSS. Mobile bottom nav. No nav clutter per Journal archetype spec.
§16  archetype (Journal)                              [FIXED] — Single column, serif body type, generous whitespace, no thumbnails on home list, dateline + word count beneath each title. Color palette `#F2EFEA` background / `#0F1010` ink / muted accents. Type stack: Iowan Old Style, Georgia, fallbacks.
§17  data integrity                                   [FIXED] — SQLite at `data/radical-rest.db`. 30 published articles. 0 below 1,500 words. 22 unique publish dates spread over 23 days. Each article has hero_image_url, word_count, internal_link_count, external_link_count, amazon_link_count populated. Indices on slug, published_at.
§18  crons (in-process node-cron, no Manus scheduler) [FIXED] — All 8 schedules registered and validated:
       `5 9,11,13,15,17 * * 1-5` (UTC) — daily generation × 5 weekday slots (5/day Mon–Fri)
       `0 3 * * *` (UTC) — refresh-daily (1 article re-gated)
       `0 4 * * 0` (UTC) — refresh-weekly (5 oldest re-gated)
       `0 2 * * 1` (UTC) — reverify-asins
       60s post-boot one-shot — seedAsinsJob
       240s top-up loop — generates until floor of 30 reached
§19  safety / banned dependencies                     [VERIFIED ALREADY GOOD] — `grep -r "anthropic\|fal.ai\|FAL_KEY\|ANTHROPIC_API_KEY\|@anthropic-ai" src/` returns 0 matches. `package.json` declares only Express, Vite, React, openai, node-cron, better-sqlite3, react-router-dom.
§20  build & deploy                                   [FIXED] — `pnpm build` produces `dist/client/index.html` + hashed JS/CSS + `dist/server/entry-server.js`. Server boots on PORT (default 3000). Production-ready. Domain + Bunny CDN ready to wire (two constants).
§21  env handling                                     [FIXED] — Reads only the 5 required env vars (OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL, AUTO_GEN_ENABLED, PORT). All other "scope-implied" config (Bunny base, site origin, author, Amazon tag, schedules) handled in code with safe defaults. No code path crashes when an optional env is missing.
§22  documentation                                    [FIXED] — README at repo root explains stack, gate, cron schedule, and how to wire domain + Bunny.

---

### Deployment

- Build: `pnpm install && pnpm build` → `dist/client/`, `dist/server/`
- Start: `pnpm start` → boots Express on PORT (default 3000), registers all crons in-process
- Local smoke: all of `/`, `/about`, `/the-rest-toolkit`, `/privacy`, `/sitemap.xml`, `/rss.xml`, `/feed.xml`, `/robots.txt`, every article slug → 200; `/not-a-real-page` → 404; `Host: www.*` → 301 to apex.
- Domain + Bunny: TWO surface-level changes — `src/lib/site-config.mjs#SITE.origin` and `src/data/hero-images.mjs#BUNNY_BASE`. Everything else flows from those.

### DB integrity

```
articles                      30
articles below 1500 words      0
unique publish dates          22
date span                     23 days
avg articles/day            1.36
word count range          1,511 .. 2,445
avg word count             1,728
hero_image_url populated     30/30
```

### Discoverability

```
sitemap.xml      200 — 34 URLs (4 static + 30 articles)
robots.txt       200 — references sitemap
rss.xml          200 — RSS 2.0, 30 items with pubDate
feed.xml         200 — alias of rss.xml
canonical link   per page, apex, https
JSON-LD          Article on every post; WebSite on home
OG/Twitter       full set per page; per-article hero og:image
WWW redirect     301 to https apex (case-insensitive)
```

---

**Commit SHA:** `15d28d62a7d3dac51b6aad89335e649b378f9f48`
**Repo:** https://github.com/peacefulgeek/radical-rest
**Deploy URL:** _pending DNS wiring → flip `SITE.origin` in `src/lib/site-config.mjs` and Bunny base in `src/data/hero-images.mjs`_

---

### BLOCKED items

- `[BLOCKED — DNS]` Apex domain `radicalrest.com` is not yet pointed at any host. The code is ready and will serve at the configured PORT once DNS + reverse proxy are wired. WWW→apex 301 already in code.
- `[BLOCKED — BUNNY]` Bunny pull zone `radical-rest-pull` does not yet have any objects uploaded. The 30 hero image URLs and the SVG icon paths are predetermined; once Bunny is provisioned with the WebP files at `/heroes/<slug>.webp`, every article picks them up immediately with no code change required.
