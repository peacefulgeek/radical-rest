// src/lib/article-quality-gate.mjs
// Authoritative quality gate. Combines:
//   - banned words from per-site scope (Oracle Lover voice rules)
//   - banned words from §12A master list (writing quality addendum)
//   - banned phrases (both lists, deduplicated, no item dropped)
//   - em-dash zero tolerance
//   - 1,200–2,500 word range, 1,600–2,000 target
//   - 3–4 Amazon links
//   - voice signals (contractions, direct address, sentence variance)
//   - structural: TL;DR + byline + datetime + ≥3 internal links + ≥1 external auth + self-ref

import { countAmazonLinks, extractAsinsFromText } from './amazon-verify.mjs';

// ----- BANNED WORDS — UNION OF ALL LISTS -----
const PER_SITE_BANNED_WORDS = [
  'profound','transformative','holistic','nuanced','multifaceted','delve','tapestry',
  'paradigm','synergy','leverage','unlock','empower','utilize','pivotal','embark',
  'underscore','paramount','seamlessly','robust','beacon','foster','elevate','curate',
  'curated','bespoke','resonate','harness','intricate','plethora','myriad',
  'groundbreaking','innovative','cutting-edge','state-of-the-art','game-changer',
  'game-changing','ever-evolving','rapidly-evolving','stakeholders','journey',
  'navigate','ecosystem','framework','comprehensive',
  // landscape (metaphorical) — flag any "landscape" use; safer to ban
  'landscape',
];

const ADDENDUM_BANNED_WORDS = [
  'delve','tapestry','paradigm','synergy','leverage','unlock','empower','utilize',
  'pivotal','embark','underscore','paramount','seamlessly','robust','beacon','foster',
  'elevate','curate','curated','bespoke','resonate','harness','intricate','plethora',
  'myriad','comprehensive','transformative','groundbreaking','innovative','cutting-edge',
  'revolutionary','state-of-the-art','ever-evolving','game-changing','next-level',
  'world-class','unparalleled','unprecedented','remarkable','extraordinary','exceptional',
  'profound','holistic','nuanced','multifaceted','stakeholders','ecosystem','landscape',
  'realm','sphere','domain','arguably','notably','crucially','importantly','essentially',
  'fundamentally','inherently','intrinsically','substantively','streamline','optimize',
  'facilitate','amplify','catalyze','propel','spearhead','orchestrate','navigate',
  'traverse','furthermore','moreover','additionally','consequently','subsequently',
  'thereby','thusly','wherein','whereby',
];

const AI_FLAGGED_WORDS = Array.from(new Set([
  ...PER_SITE_BANNED_WORDS,
  ...ADDENDUM_BANNED_WORDS,
])).map(w => w.toLowerCase());

// ----- BANNED PHRASES — UNION OF ALL LISTS -----
const PER_SITE_BANNED_PHRASES = [
  "it's important to note that","it's worth noting that","it's crucial to",
  "in conclusion,","in summary,","to summarize,","in the realm of","a holistic approach",
  "foster meaningful connections","unlock your potential","dive deep into",
  "delve into the intricacies","at the end of the day","move the needle",
  "it goes without saying","needless to say","in today's fast-paced world",
  "in today's digital age",
];

const ADDENDUM_BANNED_PHRASES = [
  "it's important to note that","it's worth noting that","it's worth mentioning",
  "it's crucial to","it is essential to","in conclusion,","in summary,","to summarize,",
  "a holistic approach","unlock your potential","unlock the power",
  "in the realm of","in the world of","dive deep into","dive into","delve into",
  "at the end of the day","in today's fast-paced world","in today's digital age",
  "in today's modern world","in this digital age","when it comes to",
  "navigate the complexities","a testament to","speaks volumes",
  "the power of","the beauty of","the art of","the journey of","the key lies in",
  "plays a crucial role","plays a vital role","plays a significant role","plays a pivotal role",
  "a wide array of","a wide range of","a plethora of","a myriad of",
  "stands as a","serves as a","acts as a","has emerged as",
  "continues to evolve","has revolutionized","cannot be overstated",
  "it goes without saying","needless to say","last but not least","first and foremost",
];

const AI_FLAGGED_PHRASES = Array.from(new Set([
  ...PER_SITE_BANNED_PHRASES,
  ...ADDENDUM_BANNED_PHRASES,
])).map(p => p.toLowerCase());

// Internal helpers
function stripHtml(text) {
  return String(text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function countWords(text) {
  const stripped = stripHtml(text);
  return stripped ? stripped.split(/\s+/).length : 0;
}

export function hasEmDash(text) {
  return String(text).includes('\u2014');
}

export function findFlaggedWords(text) {
  const stripped = stripHtml(text).toLowerCase();
  const found = [];
  for (const w of AI_FLAGGED_WORDS) {
    const pat = w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (new RegExp(`\\b${pat}\\b`, 'i').test(stripped)) found.push(w);
  }
  return found;
}

export function findFlaggedPhrases(text) {
  const stripped = stripHtml(text).toLowerCase().replace(/\s+/g, ' ');
  return AI_FLAGGED_PHRASES.filter(p => stripped.includes(p));
}

export function voiceSignals(text) {
  const stripped = stripHtml(text);
  const lower = stripped.toLowerCase();
  const contractions = (lower.match(/\b\w+'(s|re|ve|d|ll|m|t)\b/g) || []).length;
  const directAddress = (lower.match(/\byou('re|r|rself)?\b/g) || []).length;
  const firstPerson = (lower.match(/\b(i|i'm|i've|i'd|i'll|my|me|mine)\b/g) || []).length;
  const sentences = stripped.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
  const variance =
    lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) /
    (lengths.length || 1);
  const stdDev = Math.sqrt(variance);
  const shortSentences = lengths.filter(l => l <= 6).length;
  const markers = [
    /\bhere's the thing\b/i, /\blook,\s/i, /\bhonestly,?\s/i, /\btruth is\b/i,
    /\bthe truth\b/i, /\bi'll tell you\b/i, /\bthink about it\b/i, /\bthat said\b/i,
    /\bbut here's\b/i, /\bso yeah\b/i, /\bkind of\b/i, /\bsort of\b/i, /\byou know\b/i,
    /\bstop overthinking\b/i, /\blet me\b/i,
  ];
  const markerCount = markers.filter(r => r.test(stripped)).length;
  return {
    contractions, directAddress, firstPerson,
    sentenceStdDev: +stdDev.toFixed(1), shortSentences,
    conversationalMarkers: markerCount,
  };
}

export function countInternalLinks(html, apexHost) {
  // internal = relative href OR same-host absolute. apexHost optional.
  const matches = String(html).match(/href=(['"])([^'"]+)\1/g) || [];
  let internal = 0;
  for (const m of matches) {
    const href = m.replace(/^href=['"]/, '').replace(/['"]$/, '');
    if (/^\//.test(href) && !/^\/\//.test(href)) internal++;
    else if (apexHost && new RegExp(`^https?://${apexHost.replace(/\./g, '\\.')}`).test(href)) internal++;
  }
  return internal;
}

export function countExternalAuthorityLinks(html) {
  // external = absolute http(s) links not on author/oracle host nor amazon
  const matches = String(html).match(/href=(['"])(https?:\/\/[^'"]+)\1/g) || [];
  let count = 0;
  for (const m of matches) {
    const href = m.replace(/^href=['"]/, '').replace(/['"]$/, '');
    if (/amazon\./i.test(href)) continue;
    if (/theoraclelover\.com/i.test(href)) continue;
    count++;
  }
  return count;
}

export function hasSelfReference(html) {
  // Self-reference = at least one mention of the site name OR an internal link.
  const hasName = /Radical Rest/i.test(stripHtml(html));
  const hasInternal = countInternalLinks(html) >= 1;
  return hasName || hasInternal;
}

export function hasOracleLoverByline(html) {
  return /theoraclelover\.com/i.test(html) || /Oracle Lover/i.test(html);
}

export function runQualityGate(articleBody, opts = {}) {
  const failures = [];
  const words = countWords(articleBody);
  if (words < 1500) failures.push(`word-count-too-low:${words}`);
  if (words > 2800) failures.push(`word-count-too-high:${words}`);

  const amzCount = countAmazonLinks(articleBody);
  if (amzCount < 3) failures.push(`amazon-links-too-few:${amzCount}`);
  if (amzCount > 4) failures.push(`amazon-links-too-many:${amzCount}`);

  if (hasEmDash(articleBody)) failures.push('contains-em-dash');

  const bw = findFlaggedWords(articleBody);
  if (bw.length > 0) failures.push(`ai-flagged-words:${bw.join(',')}`);

  const bp = findFlaggedPhrases(articleBody);
  if (bp.length > 0) failures.push(`ai-flagged-phrases:${bp.slice(0, 5).join('|')}`);

  const internal = countInternalLinks(articleBody, opts.apexHost);
  if (internal < 3) failures.push(`internal-links-too-few:${internal}`);

  const external = countExternalAuthorityLinks(articleBody);
  if (external < 1) failures.push(`external-authority-links-too-few:${external}`);

  if (!hasSelfReference(articleBody)) failures.push('missing-self-reference');
  if (!hasOracleLoverByline(articleBody)) failures.push('missing-oracle-byline-trace');

  const voice = voiceSignals(articleBody);
  if (voice.contractions < 6) failures.push(`contractions-too-few:${voice.contractions}`);
  if (voice.directAddress === 0 && voice.firstPerson === 0) {
    failures.push('no-direct-address-or-first-person');
  }
  if (voice.sentenceStdDev < 4) failures.push(`sentence-variance-too-low:${voice.sentenceStdDev}`);
  if (voice.shortSentences < 2) failures.push(`too-few-short-sentences:${voice.shortSentences}`);
  if (voice.conversationalMarkers < 2) {
    failures.push(`conversational-markers-too-few:${voice.conversationalMarkers}`);
  }

  return {
    passed: failures.length === 0,
    failures,
    wordCount: words,
    amazonLinks: amzCount,
    asins: extractAsinsFromText(articleBody),
    voice,
    internalLinks: internal,
    externalLinks: external,
  };
}

export const ALL_BANNED_WORDS = AI_FLAGGED_WORDS;
export const ALL_BANNED_PHRASES = AI_FLAGGED_PHRASES;
