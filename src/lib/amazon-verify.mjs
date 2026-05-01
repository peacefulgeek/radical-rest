// src/lib/amazon-verify.mjs
// Amazon link/ASIN utilities and live verification helpers.

import https from 'node:https';
import { SITE } from './site-config.mjs';

const ASIN_RE = /\/dp\/([A-Z0-9]{10})\b/g;

export function extractAsinsFromText(text) {
  const found = new Set();
  const re = new RegExp(ASIN_RE.source, 'g');
  let m;
  while ((m = re.exec(String(text))) !== null) found.add(m[1]);
  return Array.from(found);
}

export function countAmazonLinks(text) {
  const matches = String(text).match(/href=(['"])https?:\/\/(www\.)?amazon\.[^'"]+\1/gi) || [];
  return matches.length;
}

export function buildAmazonUrl(asin) {
  return `https://www.amazon.com/dp/${asin}?tag=${SITE.amazon.tag}`;
}

// Live verification with HEAD then GET fallback. Treats redirect to search or
// 404 as failure. Network failure -> treat as transient (return null).
export function verifyAsinLive(asin, { timeoutMs = 8000 } = {}) {
  return new Promise((resolve) => {
    const url = `https://www.amazon.com/dp/${asin}`;
    const opts = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadicalRestVerifier/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    };
    const req = https.request(url, opts, (res) => {
      let body = '';
      const status = res.statusCode || 0;
      const location = (res.headers.location || '').toLowerCase();
      // 3xx with redirect to search means dead ASIN.
      if (status >= 300 && status < 400 && /\/s\?|\/errors\/validateCaptcha/i.test(location)) {
        res.resume();
        return resolve({ ok: false, reason: `redirect:${status}` });
      }
      res.setEncoding('utf8');
      res.on('data', (c) => { body += c; if (body.length > 200000) { res.destroy(); } });
      res.on('end', () => {
        if (status !== 200) return resolve({ ok: false, reason: `status:${status}` });
        const titleMatch = body.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';
        if (!title || /Page Not Found|Sorry|Robot Check/i.test(title)) {
          return resolve({ ok: false, reason: `bad-title:${title.slice(0, 60)}` });
        }
        resolve({ ok: true, title });
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(timeoutMs, () => { req.destroy(); resolve(null); });
    req.end();
  });
}
