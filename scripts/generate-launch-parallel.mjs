// scripts/generate-launch-parallel.mjs
// Parallel version of the launch generator. Up to CONCURRENCY topics in flight
// at once. Each topic still goes through its own 3-attempt gate loop.

import { TOPICS, slugifyTopic } from '../src/data/topics.mjs';
import { generateOneArticle } from '../src/lib/generate-article.mjs';
import { countPublishedArticles, getArticleBySlug, recentGateLog } from '../src/lib/db.mjs';

process.on('unhandledRejection', (reason) => {
  console.error('[launch] unhandledRejection', reason && (reason.stack || reason.message || reason));
});
process.on('uncaughtException', (err) => {
  console.error('[launch] uncaughtException', err && (err.stack || err.message || err));
});
for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGPIPE']) {
  process.on(sig, () => {
    console.error(`[launch] received ${sig}, ignoring to keep going`);
  });
}
process.on('exit', (code) => {
  console.error(`[launch] PROCESS EXITING with code=${code}`);
});

const COUNT = parseInt(process.env.LAUNCH_COUNT || '30', 10);
const CONCURRENCY = parseInt(process.env.LAUNCH_CONCURRENCY || '8', 10);

// Build a list of 30 publish timestamps spread across the last ~6 weeks.
function buildPublishSchedule(n) {
  const now = Date.now();
  const out = [];
  let cursor = now - 24 * 3600 * 1000; // yesterday baseline
  for (let i = 0; i < n; i++) {
    const d = new Date(cursor);
    cursor -= 24 * 3600 * 1000;
    if (d.getUTCDay() === 0 && i % 7 !== 3) {
      cursor -= 24 * 3600 * 1000;
      d.setUTCDate(d.getUTCDate() - 1);
    }
    const hourSlots = [14, 16, 11, 9, 17];
    const minuteSlots = [5, 30, 15, 45, 20];
    const slot = i % hourSlots.length;
    d.setUTCHours(hourSlots[slot], minuteSlots[slot], 0, 0);
    out.push(d.toISOString());
  }
  out.reverse();
  return out;
}

async function runWorker(queue, schedule, results) {
  while (queue.length) {
    const i = queue.shift();
    if (i === undefined) return;
    const slug = slugifyTopic(TOPICS[i]);
    if (getArticleBySlug(slug)) {
      results.push({ i, slug, ok: true, skipped: true });
      console.log(`[skip] i=${i} ${slug}`);
      continue;
    }
    console.log(`[start] i=${i} "${TOPICS[i].slice(0, 60)}"`);
    try {
      const r = await generateOneArticle({ topicIndex: i, publishedAt: schedule[i] });
      if (r.ok) {
        console.log(`[ok]    i=${i} ${slug} words=${r.gate.wordCount} amz=${r.gate.amazonLinks}`);
        results.push({ i, slug, ok: true });
      } else {
        console.log(`[fail]  i=${i} ${slug} ${r.reason} ${(r.failures||[]).slice(0,3).join(',')}`);
        results.push({ i, slug, ok: false, reason: r.reason, failures: r.failures });
      }
    } catch (err) {
      console.log(`[throw] i=${i} ${slug} ${String(err.message).slice(0, 200)}`);
      results.push({ i, slug, ok: false, reason: 'throw', err: err.message });
    }
  }
}

async function runOnePass(passNum, indices, schedule) {
  const queue = [...indices];
  console.log(`[launch] pass=${passNum} queued=${queue.length} have=${countPublishedArticles()} concurrency=${CONCURRENCY}`);
  const results = [];
  const workers = [];
  for (let w = 0; w < CONCURRENCY; w++) workers.push(runWorker(queue, schedule, results));
  await Promise.all(workers);
  return results;
}

async function main() {
  const schedule = buildPublishSchedule(COUNT);
  const MAX_PASSES = 6;

  for (let pass = 1; pass <= MAX_PASSES; pass++) {
    // Compute the list of topic indices that don't yet exist as articles.
    const missing = [];
    for (let i = 0; i < COUNT; i++) {
      const slug = slugifyTopic(TOPICS[i]);
      if (!getArticleBySlug(slug)) missing.push(i);
    }
    if (missing.length === 0) {
      console.log(`[launch] all ${COUNT} articles present. exiting.`);
      break;
    }
    console.log(`[launch] pass=${pass}/${MAX_PASSES} missing=${missing.length}`);
    const results = await runOnePass(pass, missing, schedule);
    const ok = results.filter(r => r.ok).length;
    const fail = results.filter(r => !r.ok).length;
    console.log(`[launch] pass=${pass} done ok=${ok} fail=${fail} published=${countPublishedArticles()}`);
  }

  // Final summary
  const have = countPublishedArticles();
  console.log(`\n[launch] FINAL published=${have}/${COUNT}`);
  if (have < COUNT) {
    const stillMissing = [];
    for (let i = 0; i < COUNT; i++) {
      const slug = slugifyTopic(TOPICS[i]);
      if (!getArticleBySlug(slug)) stillMissing.push({ i, slug, topic: TOPICS[i] });
    }
    console.log('STILL MISSING:');
    for (const m of stillMissing) console.log(`  i=${m.i} ${m.slug}`);
    console.log('recent gate failures:');
    for (const g of recentGateLog(10)) {
      console.log(`  topic="${g.topic.slice(0, 50)}" attempt=${g.attempt} pass=${g.passed} fails=${g.failures.slice(0, 200)}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
