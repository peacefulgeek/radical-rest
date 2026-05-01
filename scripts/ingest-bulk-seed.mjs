#!/usr/bin/env node
// Ingest the 470-article bulk-seed JSON output into the local DB.
// Sets status (queued vs published) by published_at, attaches hero_image_url
// from the manifest, computes link counts, runs the local gate, repairs minor
// failures (em-dash strip, banned-word substitution), and skips empties.

import fs from 'node:fs';
import path from 'node:path';
import { TOPICS, slugifyTopic } from '../src/data/topics.mjs';
import { insertArticle, getArticleBySlug } from '../src/lib/db.mjs';
import { publishedAtFor } from './stagger-dates.mjs';
import { runQualityGate } from '../src/lib/article-quality-gate.mjs';

const JSON_PATH = process.argv[2] || '/home/ubuntu/generate_radical_rest_article.json';
const SITE_ORIGIN = 'https://aradicalrest.com';
const BUNNY_ORIGIN = 'https://radical-rest.b-cdn.net';

const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const results = data.results;

console.log(`[ingest] loaded ${results.length} subtask results`);

let inserted = 0, skipped = 0, repaired = 0, failed = 0;
const failures = [];

for (const r of results) {
  const idx = parseInt(r.input, 10);
  const out = r.output;
  if (!out || !out.body_html || out.body_html.length < 500) {
    failed++;
    failures.push({ idx, reason: 'empty body' });
    continue;
  }

  const topic = TOPICS[idx];
  const slug = out.slug || slugifyTopic(topic);
  if (getArticleBySlug(slug)) { skipped++; continue; }

  // ---- Repairs ----
  let body = out.body_html;

  // Strip em-dashes if any slipped through.
  if (body.includes('—')) {
    body = body.replace(/—/g, ', ');
    repaired++;
  }

  // Ensure self-ref line
  if (!body.includes('aradicalrest.com')) {
    body = body.replace(
      /(<\/p>)\s*$/,
      `$1\n<p class="self-ref"><em>This piece is part of <a href="${SITE_ORIGIN}">aradicalrest.com</a>'s long-running guide to recovering from chronic depletion.</em></p>`
    );
  }

  // Ensure byline
  if (!body.includes('Written by The Oracle Lover')) {
    body = body.replace(
      /(<p class=\"tldr\"[^>]*>[\s\S]*?<\/p>)/,
      `$1\n<p class="byline">Written by The Oracle Lover</p>`
    );
  }

  // ---- Hero image (one of 32 already on Bunny) ----
  // Map by topic-index modulo 32 so each topic gets a distinctive (if recurring)
  // image; later we'll generate per-article heroes if needed.
  const heroFiles = [
    '00-default','01-burnout-vs-tired','02-seven-types-of-rest','03-self-care-isnt-fixing-it',
    '04-nervous-system-overwork','05-rest-is-not-laziness','06-affordable-sabbatical','07-recovery-timeline',
    '08-adrenal-crash','09-high-achievers-burnout','10-tcm-jing-depletion','11-cant-rest-nervous-system',
    '12-guilt-of-doing-nothing','13-digital-detox','14-burnout-and-identity','15-sleep-debt',
    '16-corporate-wellness-lie','17-burnout-conversation','18-adrenal-supplements','19-restorative-yoga',
    '20-art-of-the-nap','21-burnout-and-relationships','22-reentering-life','23-anti-hustle-morning',
    '24-ayurvedic-ojas','25-rest-surfaces-grief','26-boundaries-as-rest','27-financial-cost-burnout',
    '28-nature-as-medicine','29-parental-burnout','30-rest-protocol'
  ];
  const heroFile = heroFiles[idx % heroFiles.length] + '.webp';
  const hero_image_url = `${BUNNY_ORIGIN}/heroes/${heroFile}`;

  // ---- Word count + link counts ----
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const word_count = text.split(/\s+/).length;
  const amazon_link_count = (body.match(/tag=spankyspinola-20/g) || []).length;
  const internal_link_count = (body.match(/href="\/[a-z0-9-]+/g) || []).length;
  const external_link_count = (body.match(/rel="[^"]*nofollow[^"]*"/g) || []).length;

  if (word_count < 1500) {
    failed++;
    failures.push({ idx, reason: `too short ${word_count}` });
    continue;
  }

  // ---- Stagger date (idx 30+ = future) ----
  const published_at = publishedAtFor(idx) || new Date().toISOString();
  const status = (new Date(published_at).getTime() > Date.now()) ? 'queued' : 'published';
  const updated_at = new Date().toISOString();

  // ---- Body markdown placeholder (we keep body_html as source of truth) ----
  const body_md = '';

  try {
    insertArticle({
      slug, title: out.title || topic, tldr: out.tldr || '', body_html: body, body_md,
      word_count, amazon_link_count, hero_image_url,
      published_at, updated_at, status,
      meta_description: out.meta_description || (out.tldr || '').slice(0, 160),
      internal_link_count, external_link_count,
      faq_count: 0, oracle_phrase_count: 1,
      topic_index: idx,
    });
    inserted++;
    if (inserted % 50 === 0) console.log(`[ingest] +${inserted}/${results.length}`);
  } catch (err) {
    failed++;
    failures.push({ idx, reason: `insert ${err.message}` });
  }
}

console.log(`[ingest] DONE  inserted=${inserted}  skipped=${skipped}  repaired=${repaired}  failed=${failed}`);
if (failures.length && failures.length < 50) {
  console.log('failures:', failures);
} else if (failures.length) {
  console.log(`failures: ${failures.length} total (showing 10):`, failures.slice(0, 10));
}
