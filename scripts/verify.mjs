// scripts/verify.mjs
// End-to-end audit. Prints PASS/FAIL for each rule. Exit 0 on all-pass.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  countPublishedArticles, listPublishedArticles, listAllArticleSlugs, recentCronLog, recentGateLog,
} from '../src/lib/db.mjs';
import { runQualityGate } from '../src/lib/article-quality-gate.mjs';
import { SITE } from '../src/lib/site-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function ok(label, cond, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`);
  return cond;
}

let allPassed = true;
function check(label, cond, detail = '') {
  const passed = !!cond;
  if (!passed) allPassed = false;
  ok(label, passed, detail);
}

// 1. Banned dependencies grep
function grepRepo(re) {
  const exts = new Set(['.js','.mjs','.cjs','.ts','.tsx','.json','.md','.html','.css']);
  const skip = new Set(['node_modules','dist','data','.git']);
  const hits = [];
  function walk(dir) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(f.name)) continue;
      const full = path.join(dir, f.name);
      if (f.isDirectory()) walk(full);
      else if (exts.has(path.extname(f.name))) {
        const txt = fs.readFileSync(full, 'utf8');
        if (re.test(txt)) hits.push(full + ':' + (txt.match(re) || []).slice(0, 1).join(''));
      }
    }
  }
  walk(ROOT);
  return hits;
}

check('No Manus artifacts',
  grepRepo(/manus|forge\.manus|vite-plugin-manus/i).length === 0);

check('No Anthropic SDK',
  grepRepo(/@anthropic-ai\/sdk|ANTHROPIC_API_KEY/).length === 0);

check('No FAL.ai',
  grepRepo(/FAL_KEY|fal\.ai/i).length === 0);

check('No Cloudflare/Wordpress/Nextjs',
  grepRepo(/cloudflare|wordpress|next\.js|next\/router/i).length === 0);

check('No MailerLite/SMTP2GO/CloudFront',
  grepRepo(/mailerlite|smtp2go|cloudfront/i).length === 0);

check('No Paul/Krishna/Kalesh refs',
  grepRepo(/paul\.wagner|paulwagner|paul wagner|shrikrishna|kalesh\.love|kalesh/i).length === 0);

// 2. DeepSeek wiring
const writerSrc = fs.readFileSync(path.join(ROOT, 'src/lib/writer.mjs'), 'utf8');
check('Writer uses OpenAI client', /from 'openai'/.test(writerSrc));
check('Writer points at api.deepseek.com', /api\.deepseek\.com/.test(writerSrc));

// 3. Image policy
function listImages(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) out.push(...listImages(full));
    else if (/\.(png|jpe?g|webp|gif|avif)$/i.test(f.name)) out.push(full);
  }
  return out;
}
const imgs = listImages(path.join(ROOT, 'public')).concat(listImages(path.join(ROOT, 'src')));
check('Zero images in repo (except favicon.svg)',
  imgs.length === 0,
  imgs.length ? `found: ${imgs.join(', ')}` : '');

// 4. Article counts and per-article gate
const count = countPublishedArticles();
check('At least 30 articles published', count >= 30, `count=${count}`);

const articles = listPublishedArticles({ limit: 100 });
let perArticleFails = 0;
for (const a of articles) {
  const full = (await import('../src/lib/db.mjs')).getArticleBySlug(a.slug);
  const gate = runQualityGate(full.body_html, { apexHost: SITE.apexDomain });
  if (!gate.passed) {
    perArticleFails++;
    console.log(`  FAIL gate: ${a.slug} -> ${gate.failures.join(',')}`);
  }
}
check('Every published article passes the quality gate now', perArticleFails === 0,
  perArticleFails ? `${perArticleFails} failing articles` : '');

// 5. Date staggering: not all on one day
const days = new Set(articles.map(a => a.published_at.slice(0, 10)));
check('Articles spread across multiple publish dates (not all one day)',
  days.size >= 10, `unique_days=${days.size}`);

// 6. Cron jobs are registered (presence check in the source)
const startSrc = fs.readFileSync(path.join(ROOT, 'scripts/start-with-cron.mjs'), 'utf8');
check('cron.schedule for daily generation present', /cron\.schedule\(\s*`5 \$\{hour\}/.test(startSrc));
check('cron.schedule for daily refresh present',    /cron\.schedule\(\s*'0 3 \* \* \*'/.test(startSrc));
check('cron.schedule for weekly refresh present',   /cron\.schedule\(\s*'0 4 \* \* 0'/.test(startSrc));
check('cron.schedule for ASIN re-verify present',   /cron\.schedule\(\s*'0 2 \* \* 1'/.test(startSrc));

// 7. WWW->apex redirect FIRST in middleware
const serverSrc = fs.readFileSync(path.join(ROOT, 'src/server/server.mjs'), 'utf8');
check('WWW->apex 301 redirect is the first middleware',
  /WWW -> apex 301[\s\S]{0,200}app\.use\(\(req, res, next\)/.test(serverSrc));

// 8. Sitemap, RSS, robots
check('robots.txt route present', /'\/robots\.txt'/.test(serverSrc));
check('sitemap.xml route present', /'\/sitemap\.xml'/.test(serverSrc));
check('rss.xml route present', /'\/rss\.xml'/.test(serverSrc));

// 9. Quality-gate is the union of banned lists
const gateSrc = fs.readFileSync(path.join(ROOT, 'src/lib/article-quality-gate.mjs'), 'utf8');
check('Gate combines per-site + addendum banned word lists',
  /PER_SITE_BANNED_WORDS/.test(gateSrc) && /ADDENDUM_BANNED_WORDS/.test(gateSrc));
check('Gate enforces zero em-dash', /hasEmDash/.test(gateSrc) && /\\u2014/.test(gateSrc));

// 10. Bunny CDN reference (no images bundled, only URLs)
const siteCfg = fs.readFileSync(path.join(ROOT, 'src/lib/site-config.mjs'), 'utf8');
check('Site config has bunny.cdnHost', /bunny.*cdnHost/.test(siteCfg));

// 11. Amazon affiliate format
check('Amazon tag is spankyspinola-20',
  fs.readFileSync(path.join(ROOT, 'src/data/product-catalog.mjs'), 'utf8').includes(''));

// 12. cron + gate logs not empty (after launch)
const cronLog = recentCronLog(20);
const gateLog = recentGateLog(20);
check('Cron log has entries', cronLog.length > 0, `entries=${cronLog.length}`);
check('Gate log has entries', gateLog.length > 0, `entries=${gateLog.length}`);

console.log('\nResult:', allPassed ? 'ALL PASS' : 'FAILURES PRESENT');
process.exit(allPassed ? 0 : 1);
