// src/lib/verify-catalog.mjs
// Bulk-verify the product catalog. Throttles to avoid Amazon rate-limit hits.

import { PRODUCTS } from '../data/product-catalog.mjs';
import { verifyAsinLive } from './amazon-verify.mjs';
import { upsertVerifiedAsin, markAsinFailed, getVerifiedAsins, logCron } from './db.mjs';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function verifyCatalog({
  perReqDelayMs = 1500,
  onlyNew = true,
  maxToCheck = 200,
} = {}) {
  const known = new Set(getVerifiedAsins());
  const targets = onlyNew ? PRODUCTS.filter(p => !known.has(p.asin)) : PRODUCTS;
  let total = 0, verified = 0, failed = 0, skipped = 0;
  for (const p of targets) {
    if (total >= maxToCheck) break;
    total++;
    const result = await verifyAsinLive(p.asin);
    if (result === null) { skipped++; await sleep(perReqDelayMs); continue; }
    if (result.ok) { upsertVerifiedAsin(p.asin, p.name, p.category); verified++; }
    else { markAsinFailed(p.asin); failed++; }
    await sleep(perReqDelayMs);
  }
  const summary = { total, verified, failed, skipped, knownVerifiedAfter: getVerifiedAsins().length };
  logCron('verify-catalog', 'ok', JSON.stringify(summary));
  return summary;
}

// Used at injection time. Returns subset of products whose ASIN is verified.
// In offline/dev or before first verification run, falls back to ALL products
// so the build never hard-blocks. The cron will replace failed ASINs over time.
export function pickVerifiedProducts(candidates) {
  const verified = new Set(getVerifiedAsins());
  if (verified.size === 0) return candidates;
  const ok = candidates.filter(p => verified.has(p.asin));
  return ok.length ? ok : candidates;
}
