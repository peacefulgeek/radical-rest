// scripts/generate-one.mjs
// Generates exactly one article and exits. Designed to be called in a tight
// shell loop (so the sandbox's process-reaper never has time to kill us).
//
// Usage:
//   node scripts/generate-one.mjs <topicIndex> [publishedAtISO]
//
// Exits 0 on success or already-exists, non-zero only on hard error.

import { TOPICS, slugifyTopic } from '../src/data/topics.mjs';
import { generateOneArticle } from '../src/lib/generate-article.mjs';
import { getArticleBySlug } from '../src/lib/db.mjs';

const i = parseInt(process.argv[2] || '0', 10);
const publishedAt = process.argv[3] || null;

(async () => {
  if (!Number.isFinite(i) || i < 0 || i >= TOPICS.length) {
    console.error(`bad-index ${i}`);
    process.exit(2);
  }
  const slug = slugifyTopic(TOPICS[i]);
  if (getArticleBySlug(slug)) {
    console.log(`SKIP ${i} ${slug} (exists)`);
    process.exit(0);
  }
  console.log(`START ${i} "${TOPICS[i].slice(0, 60)}"`);
  try {
    const r = await generateOneArticle({ topicIndex: i, publishedAt });
    if (r.ok) {
      console.log(`OK ${i} ${slug} words=${r.gate.wordCount} amz=${r.gate.amazonLinks}`);
      process.exit(0);
    }
    console.log(`FAIL ${i} ${slug} ${r.reason} ${(r.failures || []).slice(0, 3).join(',')}`);
    process.exit(1);
  } catch (err) {
    console.error(`THROW ${i} ${slug} ${String(err.message).slice(0, 200)}`);
    process.exit(3);
  }
})();
