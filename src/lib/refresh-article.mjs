// src/lib/refresh-article.mjs
// Content refresh job. Re-checks an article against the current gate. If it
// fails (banned word slipped in due to spec changes, em-dash, link counts),
// regenerates up to 3 times. On 3 failures: keep the original body, just bump
// refreshed_at so we don't loop on the same one forever.

import { runQualityGate, hasEmDash } from './article-quality-gate.mjs';
import { sanitizeArticleHtml, generateWithGate } from './writer.mjs';
import { productsForTopic } from '../data/product-catalog.mjs';
import { pickVerifiedProducts } from './verify-catalog.mjs';
import { TOPICS } from '../data/topics.mjs';
import { SITE } from './site-config.mjs';
import { getArticleById, updateArticleBody, listArticlesNeedingRefresh, logCron, listPublishedArticles } from './db.mjs';

function pickInternalLinkSlugs(currentSlug, max = 6) {
  const all = listPublishedArticles({ limit: 60 }).filter(a => a.slug !== currentSlug);
  return all.slice(0, max).map(a => ({ slug: a.slug, title: a.title }));
}

export async function refreshOneArticle(id) {
  const a = getArticleById(id);
  if (!a) return { ok: false, reason: 'not-found' };

  // First, sanitize-only pass: strip em-dashes if any sneaked in via spec
  // changes. If sanitize alone fixes the gate, save and exit.
  const sanitized = sanitizeArticleHtml(a.body_html);
  let gate = runQualityGate(sanitized, { apexHost: SITE.apexDomain });
  if (gate.passed) {
    updateArticleBody(id, {
      body_html: sanitized,
      word_count: gate.wordCount,
      amazon_link_count: gate.amazonLinks,
      internal_link_count: gate.internalLinks,
      external_link_count: gate.externalLinks,
      refreshed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    logCron('refresh-article', 'ok-sanitize', `id=${id} slug=${a.slug}`);
    return { ok: true, mode: 'sanitize-only' };
  }

  // Otherwise, attempt a full regeneration on the same topic.
  const topicIndex = a.topic_index ?? 0;
  const topic = TOPICS[topicIndex] || a.title;
  const candidates = productsForTopic(topic, 8);
  const products = pickVerifiedProducts(candidates).slice(0, 6);
  const internalLinkSlugs = pickInternalLinkSlugs(a.slug, 6);

  const result = await generateWithGate({
    topic, topicIndex, products, internalLinkSlugs,
    apexHost: SITE.apexDomain,
  });

  if (result && result.article && result.gate && result.gate.passed) {
    const html = sanitizeArticleHtml(result.article.body_html);
    const finalGate = runQualityGate(html, { apexHost: SITE.apexDomain });
    if (finalGate.passed) {
      updateArticleBody(id, {
        body_html: html,
        tldr: result.article.tldr || a.tldr,
        meta_description: result.article.meta_description || a.meta_description,
        word_count: finalGate.wordCount,
        amazon_link_count: finalGate.amazonLinks,
        internal_link_count: finalGate.internalLinks,
        external_link_count: finalGate.externalLinks,
        refreshed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      logCron('refresh-article', 'ok-regen', `id=${id} slug=${a.slug}`);
      return { ok: true, mode: 'regenerate' };
    }
  }

  // 3 attempts failed inside generateWithGate. Per addendum: keep original,
  // bump refreshed_at, do not store broken article.
  updateArticleBody(id, { refreshed_at: new Date().toISOString() });
  logCron('refresh-article', 'kept-original', `id=${id} slug=${a.slug} reason=gate-failed-3x`);
  return { ok: true, mode: 'kept-original' };
}

export async function refreshBatch({ olderThanDays, limit }) {
  const list = listArticlesNeedingRefresh({ olderThanDays, limit });
  const results = [];
  for (const row of list) {
    const r = await refreshOneArticle(row.id);
    results.push({ slug: row.slug, ...r });
    // Small breathing room between API calls.
    await new Promise(r => setTimeout(r, 750));
  }
  logCron('refresh-batch', 'done', `count=${results.length}`);
  return results;
}
