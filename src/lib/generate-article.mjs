// src/lib/generate-article.mjs
// Orchestrates: pick products -> generate -> sanitize -> gate -> store.

import { generateWithGate, sanitizeArticleHtml } from './writer.mjs';
import { runQualityGate } from './article-quality-gate.mjs';
import { productsForTopic } from '../data/product-catalog.mjs';
import { pickVerifiedProducts } from './verify-catalog.mjs';
import { TOPICS, slugifyTopic } from '../data/topics.mjs';
import { SITE, bunnyImage } from './site-config.mjs';
import { heroImageFor } from '../data/hero-images.mjs';
import {
  insertArticle, listAllArticleSlugs, listPublishedArticles, logCron,
  getArticleBySlug,
} from './db.mjs';

function pickInternalLinkSlugs(currentSlug, max = 6) {
  const all = listPublishedArticles({ limit: 60 }).filter(a => a.slug !== currentSlug);
  return all.slice(0, max).map(a => ({ slug: a.slug, title: a.title }));
}

// Hero image is looked up from the per-article manifest (src/data/hero-images.mjs).
// Each topic slug maps to a unique on-brand WebP filename on the Bunny zone.
// Code never bundles the bytes; it only references the URL.

export async function generateOneArticle({ topicIndex, publishedAt = null, force = false }) {
  const topic = TOPICS[topicIndex];
  if (!topic) throw new Error(`No topic at index ${topicIndex}`);
  const slug = slugifyTopic(topic);

  if (!force && getArticleBySlug(slug)) {
    return { skipped: true, reason: 'already-exists', slug };
  }

  const candidates = productsForTopic(topic, 8);
  const products = pickVerifiedProducts(candidates).slice(0, 6);

  const internalLinkSlugs = pickInternalLinkSlugs(slug, 6);

  const result = await generateWithGate({
    topic, topicIndex, products, internalLinkSlugs,
    apexHost: SITE.apexDomain,
  });

  if (!result || !result.article) {
    logCron('generate-article', 'fail', `topic="${topic}" no-output`);
    return { ok: false, reason: 'no-output', slug };
  }
  if (!result.gate.passed) {
    logCron(
      'generate-article', 'fail',
      `topic="${topic}" failures=${result.gate.failures.join('|')}`
    );
    return { ok: false, reason: 'gate-failed', slug, failures: result.gate.failures };
  }

  const a = result.article;
  const html = sanitizeArticleHtml(a.body_html, { topicIndex, internalLinkSlugs });
  // Re-run gate on the sanitized HTML to catch sneaky em-dashes.
  const finalGate = runQualityGate(html, { apexHost: SITE.apexDomain });
  if (!finalGate.passed) {
    logCron('generate-article', 'fail', `topic="${topic}" final-gate=${finalGate.failures.join('|')}`);
    return { ok: false, reason: 'final-gate-failed', slug, failures: finalGate.failures };
  }

  const now = new Date().toISOString();
  const pubAt = publishedAt || now;
  // Anything dated in the future is queued; the publishing cron will flip
  // status='published' when the slot arrives. Past-dated stays 'published'.
  const status = (new Date(pubAt).getTime() > Date.now() + 60_000) ? 'queued' : 'published';
  insertArticle({
    slug,
    title: a.title || topic,
    tldr: a.tldr || '',
    body_html: html,
    body_md: '',
    word_count: finalGate.wordCount,
    amazon_link_count: finalGate.amazonLinks,
    hero_image_url: heroImageFor(slug).url,
    published_at: pubAt,
    updated_at: now,
    status,
    meta_description: a.meta_description || a.tldr || '',
    opener_type: a.opener_type || '',
    conclusion_type: a.conclusion_type || '',
    faq_count: 0,
    oracle_phrase_count: 0,
    internal_link_count: finalGate.internalLinks,
    external_link_count: finalGate.externalLinks,
    topic_index: topicIndex,
  });

  logCron('generate-article', 'ok', `topic="${topic}" slug=${slug} words=${finalGate.wordCount}`);
  return { ok: true, slug, gate: finalGate };
}
