// src/lib/cron-jobs.mjs
// All cron handlers in one place. Wired by scripts/start-with-cron.mjs.

import { generateOneArticle } from './generate-article.mjs';
import { refreshBatch } from './refresh-article.mjs';
import { verifyCatalog } from './verify-catalog.mjs';
import { TOPICS } from '../data/topics.mjs';
import {
  countPublishedArticles, listAllArticleSlugs, getArticleBySlug, logCron,
} from './db.mjs';

const TOTAL_TOPICS = TOPICS.length;

// Find the next topic index that hasn't been published yet.
function nextUnpublishedTopicIndex() {
  for (let i = 0; i < TOTAL_TOPICS; i++) {
    const slug = require('../data/topics.mjs').slugifyTopic(TOPICS[i]);
    if (!getArticleBySlug(slug)) return i;
  }
  return -1;
}

// ESM-safe variant.
import { slugifyTopic } from '../data/topics.mjs';
function nextUnpublishedTopicIndexEsm() {
  for (let i = 0; i < TOTAL_TOPICS; i++) {
    const s = slugifyTopic(TOPICS[i]);
    if (!getArticleBySlug(s)) return i;
  }
  return -1;
}

// Daily generation: writes up to N articles, one per call. The cron triggers
// 5 calls per weekday at staggered times.
export async function dailyGenerationJob({ batchSize = 1, ceiling = 250 } = {}) {
  const enabled = String(process.env.AUTO_GEN_ENABLED || 'true').toLowerCase() === 'true';
  if (!enabled) {
    logCron('daily-generation', 'skipped', 'AUTO_GEN_ENABLED=false');
    return { skipped: true };
  }
  const have = countPublishedArticles();
  if (have >= ceiling) {
    logCron('daily-generation', 'ceiling', `have=${have} ceiling=${ceiling}`);
    return { ceiling: true };
  }
  let generated = 0;
  for (let n = 0; n < batchSize; n++) {
    const idx = nextUnpublishedTopicIndexEsm();
    if (idx < 0) {
      logCron('daily-generation', 'no-topics-left', `have=${have + generated}`);
      break;
    }
    try {
      const r = await generateOneArticle({ topicIndex: idx });
      if (r.ok) generated++;
    } catch (err) {
      logCron('daily-generation', 'error', `idx=${idx} ${String(err.message).slice(0, 200)}`);
    }
  }
  logCron('daily-generation', 'done', `generated=${generated}`);
  return { generated };
}

// Refresh job: 25 articles per 30 days target translates to roughly one per
// day (we run daily). Older first.
export async function refreshDailyJob({ limit = 1, olderThanDays = 30 } = {}) {
  const r = await refreshBatch({ limit, olderThanDays });
  return r;
}

// Deeper refresh: 20 articles / 90 days. Run weekly.
export async function refreshWeeklyJob({ limit = 5, olderThanDays = 90 } = {}) {
  const r = await refreshBatch({ limit, olderThanDays });
  return r;
}

// Re-verify ASINs weekly to catch dead products.
export async function reverifyAsinsJob() {
  const r = await verifyCatalog({ onlyNew: false, perReqDelayMs: 2500, maxToCheck: 60 });
  return r;
}

// First-boot ASIN seed: only verify ones not yet known.
export async function seedAsinsJob() {
  const r = await verifyCatalog({ onlyNew: true, perReqDelayMs: 2000, maxToCheck: 200 });
  return r;
}
