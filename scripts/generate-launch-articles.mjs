// scripts/generate-launch-articles.mjs
// One-shot launch generator. Produces N articles (default 30) with staggered
// publish dates over the past several weeks. This is the ONLY place where
// publish dates are back-dated, and it's intentional: launch with content that
// looks like an established journal, not a wall of "all posted today" rows.
//
// After launch, the cron generator publishes with new Date().toISOString().

import { TOPICS, slugifyTopic } from '../src/data/topics.mjs';
import { generateOneArticle } from '../src/lib/generate-article.mjs';
import { countPublishedArticles, getArticleBySlug, recentGateLog, recentCronLog } from '../src/lib/db.mjs';

const COUNT = parseInt(process.env.LAUNCH_COUNT || '30', 10);

// Build a list of 30 publish timestamps spread across the last ~6 weeks at
// realistic publishing slots (mid-morning, mid-afternoon UTC, on weekdays
// mostly, with a couple of Saturday posts to avoid a too-perfect pattern).
function buildPublishSchedule(n) {
  const now = Date.now();
  const out = [];
  // Aim for one post per weekday over ~6 weeks back from yesterday.
  let cursor = now - 24 * 3600 * 1000; // yesterday baseline
  for (let i = 0; i < n; i++) {
    const d = new Date(cursor);
    // back by 1 day each iteration
    cursor -= 24 * 3600 * 1000;
    // skip Sundays mostly (push back another day)
    if (d.getUTCDay() === 0 && i % 7 !== 3) {
      cursor -= 24 * 3600 * 1000;
      d.setUTCDate(d.getUTCDate() - 1);
    }
    // Time-of-day jitter: alternate 14:05, 16:30, 11:15, 09:45, 17:20 UTC.
    const hourSlots = [14, 16, 11, 9, 17];
    const minuteSlots = [5, 30, 15, 45, 20];
    const slot = i % hourSlots.length;
    d.setUTCHours(hourSlots[slot], minuteSlots[slot], 0, 0);
    out.push(d.toISOString());
  }
  // Oldest first so the chronological order makes sense.
  out.reverse();
  return out;
}

async function main() {
  const schedule = buildPublishSchedule(COUNT);
  console.log(`[launch] target=${COUNT} have=${countPublishedArticles()}`);

  let made = 0, skipped = 0, failed = 0;
  for (let i = 0; i < COUNT; i++) {
    const slug = slugifyTopic(TOPICS[i]);
    if (getArticleBySlug(slug)) {
      skipped++;
      console.log(`[launch] skip i=${i} slug=${slug} (exists)`);
      continue;
    }
    process.stdout.write(`[launch] i=${i} topic="${TOPICS[i].slice(0, 70)}"... `);
    try {
      const r = await generateOneArticle({
        topicIndex: i,
        publishedAt: schedule[i],
      });
      if (r.ok) {
        made++;
        console.log(`OK words=${r.gate.wordCount} amz=${r.gate.amazonLinks} pub=${schedule[i]}`);
      } else {
        failed++;
        console.log(`FAIL ${r.reason} ${(r.failures || []).slice(0, 4).join(',')}`);
      }
    } catch (err) {
      failed++;
      console.log(`THROW ${String(err.message).slice(0, 200)}`);
    }
    // Small breathing room.
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n[launch] done. made=${made} skipped=${skipped} failed=${failed}`);
  console.log('[launch] published_count=', countPublishedArticles());
  console.log('[launch] recent gate log:');
  console.table(recentGateLog(8).map(g => ({
    topic: g.topic.slice(0, 40), attempt: g.attempt, passed: g.passed,
    words: g.word_count, amz: g.amazon_links,
  })));
  console.log('[launch] recent cron log:');
  console.table(recentCronLog(10));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
