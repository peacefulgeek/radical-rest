#!/usr/bin/env node
// One-time bulk pre-seed of the 470 NEW articles (indices 30-499).
// Each article: ≥1800 words, gate-passed, stored with status='queued' and a
// staggered future publish_at. The queued-publisher cron rolls them onto the
// public site one weekday at a time.
//
// Designed for SEQUENTIAL invocation inside a single shell session — caller
// runs `node bulk-seed-500.mjs <fromIdx> <toIdx>` over a range slice.
// Prints heartbeat lines every article so the sandbox process-reaper sees
// activity. Exits 0 when range complete; non-zero only on hard config errors.

import { TOPICS, slugifyTopic } from '../src/data/topics.mjs';
import { generateOneArticle } from '../src/lib/generate-article.mjs';
import { getArticleBySlug } from '../src/lib/db.mjs';
import { publishedAtFor } from './stagger-dates.mjs';

const FROM = parseInt(process.argv[2] || '30', 10);
const TO = Math.min(parseInt(process.argv[3] || '499', 10), TOPICS.length - 1);
const MAX_RETRIES = parseInt(process.argv[4] || '2', 10);

console.log(`[bulk-seed] range=[${FROM},${TO}] retries=${MAX_RETRIES} total-topics=${TOPICS.length}`);
let ok = 0, skipped = 0, failed = 0;

for (let i = FROM; i <= TO; i++) {
  const slug = slugifyTopic(TOPICS[i]);
  if (getArticleBySlug(slug)) {
    console.log(`SKIP ${i} ${slug}`);
    skipped++;
    continue;
  }
  const pubAt = publishedAtFor(i);
  let lastFail = null;
  let success = false;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    process.stdout.write(`[${new Date().toISOString().slice(11,19)}] try i=${i} a=${attempt}  `);
    try {
      const r = await generateOneArticle({ topicIndex: i, publishedAt: pubAt });
      if (r.ok) {
        console.log(`OK words=${r.gate.wordCount} amz=${r.gate.amazonLinks}`);
        ok++; success = true; break;
      }
      lastFail = `${r.reason} ${(r.failures || []).slice(0,2).join(',')}`;
      console.log(`FAIL ${lastFail}`);
    } catch (err) {
      lastFail = `THROW ${String(err.message).slice(0,120)}`;
      console.log(lastFail);
    }
  }
  if (!success) {
    failed++;
    console.error(`[bulk-seed] GIVE-UP i=${i} slug=${slug} lastFail="${lastFail}"`);
  }
  // Periodic progress summary
  if ((i - FROM) % 10 === 0) {
    console.log(`[progress] i=${i} ok=${ok} skipped=${skipped} failed=${failed}`);
  }
}

console.log(`[bulk-seed] DONE range=[${FROM},${TO}] ok=${ok} skipped=${skipped} failed=${failed}`);
process.exit(0);
