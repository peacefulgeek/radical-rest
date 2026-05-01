// src/lib/db.mjs
// Lightweight SQLite layer using Node 22's built-in node:sqlite.
// No native compile required. WAL + busy_timeout enabled.
//
// API surface kept identical to the prior better-sqlite3 implementation
// so all callers (server, cron jobs, generator) continue to work unchanged.

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.resolve(__dirname, '..', '..', 'data', 'radical-rest.db');
const DB_PATH = process.env.SQLITE_PATH || DEFAULT_DB_PATH;

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA busy_timeout = 10000');
db.exec('PRAGMA synchronous = NORMAL');

db.exec(`
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tldr TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_md TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  amazon_link_count INTEGER NOT NULL DEFAULT 0,
  hero_image_url TEXT,
  author_name TEXT NOT NULL DEFAULT 'The Oracle Lover',
  author_link TEXT NOT NULL DEFAULT 'https://theoraclelover.com',
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  meta_description TEXT,
  opener_type TEXT,
  conclusion_type TEXT,
  faq_count INTEGER DEFAULT 0,
  oracle_phrase_count INTEGER DEFAULT 0,
  internal_link_count INTEGER DEFAULT 0,
  external_link_count INTEGER DEFAULT 0,
  topic_index INTEGER,
  refreshed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

CREATE TABLE IF NOT EXISTS verified_asins (
  asin TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  last_checked_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'verified'
);

CREATE TABLE IF NOT EXISTS cron_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job TEXT NOT NULL,
  ran_at TEXT NOT NULL,
  outcome TEXT NOT NULL,
  detail TEXT
);

CREATE INDEX IF NOT EXISTS idx_cron_log_ran_at ON cron_log(job, ran_at DESC);

CREATE TABLE IF NOT EXISTS gate_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  failures TEXT,
  word_count INTEGER,
  amazon_links INTEGER,
  ran_at TEXT NOT NULL
);
`);

// ---------------------------------------------------------------------------
// Public API (kept compatible with previous better-sqlite3 surface)
// ---------------------------------------------------------------------------

export function listPublishedArticles({ limit = 200, offset = 0 } = {}) {
  return db
    .prepare(
      `SELECT id, slug, title, tldr, hero_image_url, published_at, word_count
       FROM articles WHERE status='published'
       ORDER BY published_at DESC LIMIT ? OFFSET ?`
    )
    .all(limit, offset);
}

export function countPublishedArticles() {
  return db
    .prepare(`SELECT COUNT(*) AS c FROM articles WHERE status='published'`)
    .get().c;
}

export function getArticleBySlug(slug) {
  // Public route caller filters on status; this returns any non-deleted row
  // so the orchestrator can de-dupe against queued articles too.
  return db
    .prepare(`SELECT * FROM articles WHERE slug=?`)
    .get(slug);
}

// Convenience for the public Article route: only return if published.
export function getPublishedArticleBySlug(slug) {
  return db
    .prepare(`SELECT * FROM articles WHERE slug=? AND status='published'`)
    .get(slug);
}

// Promote any queued articles whose published_at is now in the past.
export function promoteDueQueuedArticles() {
  const now = new Date().toISOString();
  return db
    .prepare(`UPDATE articles SET status='published' WHERE status='queued' AND published_at <= ?`)
    .run(now);
}

export function countByStatus() {
  const rows = db.prepare(`SELECT status, COUNT(*) as c FROM articles GROUP BY status`).all();
  return Object.fromEntries(rows.map(r => [r.status, r.c]));
}

export function insertArticle(a) {
  // node:sqlite supports named params via $name; pre-compute defaults.
  const v = {
    author_name: 'The Oracle Lover',
    author_link: 'https://theoraclelover.com',
    status: 'published',
    meta_description: null,
    opener_type: null,
    conclusion_type: null,
    faq_count: 0,
    oracle_phrase_count: 0,
    internal_link_count: 0,
    external_link_count: 0,
    topic_index: null,
    hero_image_url: null,
    ...a,
  };
  const stmt = db.prepare(`
    INSERT INTO articles
      (slug, title, tldr, body_html, body_md, word_count, amazon_link_count,
       hero_image_url, author_name, author_link, published_at, updated_at,
       status, meta_description, opener_type, conclusion_type, faq_count,
       oracle_phrase_count, internal_link_count, external_link_count, topic_index)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  return stmt.run(
    v.slug, v.title, v.tldr, v.body_html, v.body_md,
    v.word_count, v.amazon_link_count,
    v.hero_image_url, v.author_name, v.author_link,
    v.published_at, v.updated_at, v.status, v.meta_description,
    v.opener_type, v.conclusion_type, v.faq_count,
    v.oracle_phrase_count, v.internal_link_count, v.external_link_count, v.topic_index
  );
}

export function updateArticleBody(id, fields) {
  const keys = Object.keys(fields);
  const sets = keys.map(k => `${k}=?`).join(', ');
  const values = keys.map(k => fields[k]);
  values.push(id);
  return db.prepare(`UPDATE articles SET ${sets} WHERE id=?`).run(...values);
}

export function getArticleById(id) {
  return db.prepare(`SELECT * FROM articles WHERE id=?`).get(id);
}

export function listArticlesNeedingRefresh({ olderThanDays, limit }) {
  const cutoff = new Date(Date.now() - olderThanDays * 86400000).toISOString();
  return db
    .prepare(
      `SELECT id, slug, title FROM articles
       WHERE status='published' AND COALESCE(refreshed_at, published_at) < ?
       ORDER BY COALESCE(refreshed_at, published_at) ASC LIMIT ?`
    )
    .all(cutoff, limit);
}

export function logCron(job, outcome, detail = '') {
  db.prepare(
    `INSERT INTO cron_log (job, ran_at, outcome, detail) VALUES (?,?,?,?)`
  ).run(job, new Date().toISOString(), outcome, detail);
}

export function recentCronLog(limit = 50) {
  return db
    .prepare(`SELECT * FROM cron_log ORDER BY ran_at DESC LIMIT ?`)
    .all(limit);
}

export function logGate(topic, attempt, passed, failures, wordCount, amazonLinks) {
  db.prepare(
    `INSERT INTO gate_log (topic, attempt, passed, failures, word_count, amazon_links, ran_at)
     VALUES (?,?,?,?,?,?,?)`
  ).run(
    topic,
    attempt,
    passed ? 1 : 0,
    failures.join('|'),
    wordCount,
    amazonLinks,
    new Date().toISOString()
  );
}

export function recentGateLog(limit = 50) {
  return db.prepare(`SELECT * FROM gate_log ORDER BY ran_at DESC LIMIT ?`).all(limit);
}

export function upsertVerifiedAsin(asin, productName, category) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO verified_asins (asin, product_name, category, verified_at, last_checked_at, status)
     VALUES (?,?,?,?,?, 'verified')
     ON CONFLICT(asin) DO UPDATE SET last_checked_at=excluded.last_checked_at, status='verified'`
  ).run(asin, productName, category, now, now);
}

export function markAsinFailed(asin) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO verified_asins (asin, product_name, category, verified_at, last_checked_at, status)
     VALUES (?, '', '', ?, ?, 'failed')
     ON CONFLICT(asin) DO UPDATE SET last_checked_at=excluded.last_checked_at, status='failed'`
  ).run(asin, now, now);
}

export function getVerifiedAsins() {
  return db.prepare(`SELECT asin FROM verified_asins WHERE status='verified'`).all().map(r => r.asin);
}

export function listAllArticleSlugs() {
  return db.prepare(`SELECT slug, published_at, updated_at FROM articles WHERE status='published'`).all();
}

export default db;
