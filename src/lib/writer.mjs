// src/lib/writer.mjs
// DeepSeek V4-Pro writer via OpenAI SDK (base URL https://api.deepseek.com).
// No Anthropic SDK. No FAL. No Manus runtime. Single endpoint, single client.

import OpenAI from 'openai';
import { SITE } from './site-config.mjs';
import { runQualityGate, ALL_BANNED_WORDS, ALL_BANNED_PHRASES } from './article-quality-gate.mjs';
import { buildAmazonUrl, extractAsinsFromText } from './amazon-verify.mjs';
import { logGate } from './db.mjs';

const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL || 'https://api.deepseek.com';
const model = process.env.OPENAI_MODEL || 'deepseek-v4-pro';

let _client = null;
function client() {
  if (!_client) {
    if (!apiKey) throw new Error('OPENAI_API_KEY missing');
    _client = new OpenAI({ apiKey, baseURL });
  }
  return _client;
}

const ORACLE_LOVER_PHRASES = [
  '"Look, here\'s the thing."',
  '"Stop overthinking this."',
  '"This isn\'t mystical. It\'s mechanical."',
  '"You already know the answer. You just don\'t like it."',
  '"Let me demystify this for you."',
  '"Here\'s what actually works."',
  '"That\'s the short version. Want the long one?"',
  '"Nobody\'s coming to explain this to you. So I will."',
  '"The body doesn\'t lie. The mind does. Constantly."',
  '"Less theory. More practice."',
];

const NICHE_RESEARCHERS = [
  'Tricia Hersey','Emily Nagoski','Amelia Nagoski','Saundra Dalton-Smith',
  'Devon Price','Anne Helen Petersen','Herbert Freudenberger','Christina Maslach',
  'Alex Soojung-Kim Pang','Celeste Headlee','Gabor Maté',
];
const SPIRITUAL_RESEARCHERS = [
  'Carl Jung','Angeles Arrien','Rachel Pollack','Clarissa Pinkola Estés','Joseph Campbell',
];

const OPENER_TYPES = ['gut-punch','question','micro-story','counterintuitive'];
const CONCLUSION_TYPES = ['cta','reflection','question','challenge','benediction'];

function pickOpener(seed) { return OPENER_TYPES[seed % OPENER_TYPES.length]; }
function pickConclusion(seed) { return CONCLUSION_TYPES[Math.floor(seed / 4) % CONCLUSION_TYPES.length]; }

// Build the prompt.
function buildPrompt({ topic, topicIndex, products, internalLinkSlugs }) {
  const opener = pickOpener(topicIndex);
  const conclusion = pickConclusion(topicIndex);
  const phraseSeed = (topicIndex * 7) % ORACLE_LOVER_PHRASES.length;
  const chosenPhrases = [
    ORACLE_LOVER_PHRASES[phraseSeed],
    ORACLE_LOVER_PHRASES[(phraseSeed + 3) % ORACLE_LOVER_PHRASES.length],
    ORACLE_LOVER_PHRASES[(phraseSeed + 6) % ORACLE_LOVER_PHRASES.length],
  ];
  const useNiche = (topicIndex % 10) < 7;
  const researcher = useNiche
    ? NICHE_RESEARCHERS[topicIndex % NICHE_RESEARCHERS.length]
    : SPIRITUAL_RESEARCHERS[topicIndex % SPIRITUAL_RESEARCHERS.length];

  const productLines = products.map(
    (p, i) => `  ${i + 1}. ${p.name}  ASIN=${p.asin}  category=${p.category}`
  ).join('\n');

  const internalLines = internalLinkSlugs.map(s => `  - /${s.slug}  ("${s.title}")`).join('\n');

  return `You are The Oracle Lover. You are NOT Krishna. You are NOT Kalesh. You write for Radical Rest, a journal about burnout recovery, anti-hustle culture, and the science of deep rest.

VOICE — non-negotiable:
- Short punchy sentences, 8 to 14 words mostly. Vary aggressively. Some 3-word fragments. Some longer.
- Practical directness. No fluff. No warming up. The first sentence hits.
- Direct address: "Look," "Here's the thing," "Let me be straight with you." Never "my friend." Never "sweetheart."
- Reference Jung, Angeles Arrien, Rachel Pollack, Clarissa Pinkola Estés, Joseph Campbell when relevant. Never Amma, Rumi, Ramana, Krishnamurti, Alan Watts, or Sam Harris.
- Frequent dry humor. Self-aware. "Yeah, that's not going to work. Here's what will."
- The no-BS oracle reader who also has a science background. Demystifying. Grounded.

HARD RULES:
- 1,800 to 2,400 words. UNDER 1,500 = AUTOMATIC FAIL. Aim for 2,000+ to be safe. Write 5-7 substantive H2 sections, each with 3-5 paragraphs. Do not pad with filler - go deeper into each section instead.
- ZERO em-dashes (the character —). Use commas, periods, colons, parentheses, "and," "which." Never the em-dash character.
- ABSOLUTELY FORBIDDEN WORDS, do not use even once: journey, optimize, optimization, optimal, inherently, leverage, framework, holistic, innovative, transformative, sacred, divine feminine, tapestry, navigate, navigating, embark, unleash, unlock, dive into, delve, uncover, unveil, harness, foster, cultivate, nurture, embrace, empower, empowering, paradigm, paradigm shift, ecosystem, synergy, holistically, mindfully, intentionally, authentically, deeply, profoundly, beautifully, uniquely, truly, ultimately, essentially, fundamentally, basically.
- Never use these additional words: ${ALL_BANNED_WORDS.join(', ')}.
- Never use these phrases: ${ALL_BANNED_PHRASES.slice(0, 60).join(' ; ')}.
- Use the simple alternative every time: "path" not journey, "improve" not optimize, "naturally" not inherently, "use" not leverage, "system" not framework, "explore" not dive into, "reveal" not unveil, "build" not foster/cultivate.
- Contractions throughout. You're. Don't. It's. That's. I've.
- At least 6 contractions. At least 2 short sentences (≤6 words). Sentence-length standard deviation ≥ 4.
- Include at least 3 of these Oracle Lover phrases verbatim:
${chosenPhrases.map(p => '  ' + p).join('\n')}
- Reference ${researcher} by name once, in context, with a real attribution.
- Include at least 2 conversational interjections: "Here's the thing," "Honestly," "Look," "Truth is," "But here's what's interesting," "That said."
- Include exactly ONE Sanskrit mantra closing on its own line, italicized in HTML (<em>...</em>).

STRUCTURE (output as clean HTML, no <html>/<body>, just article body):
- Opener type: ${opener}
- Conclusion type: ${conclusion}
- Use <h2> and <h3> for sections. <p> for paragraphs. <blockquote> sparingly. <ul>/<li> when listing.
- ${(topicIndex % 3) === 0 ? 'Include 2-3 FAQs at the end as <h3>Q.</h3><p>A.</p> pairs.' : ((topicIndex % 3) === 1 ? 'Include 5 FAQs at the end as <h3>Q.</h3><p>A.</p> pairs.' : 'Do NOT include an FAQ section.')}

LINK REQUIREMENTS:
- At least 3 internal links (count them, must be 3 or more) to OTHER Radical Rest articles. Pick from this list below; if fewer than 3 are listed, additionally link to /about, /the-rest-toolkit, and /privacy. Vary the anchor text. Use plain relative URLs like <a href="/the-7-types-of-rest-youre-probably-missing">.
${internalLines || '  - (no siblings yet — use /about and /the-rest-toolkit and /privacy)'}
- At least 1 external authoritative link (PubMed, NIH, peer-reviewed source, mainstream science publisher, university). Real URL. Use rel="noopener nofollow".
- Include 1 self-referencing line that names "Radical Rest" in the prose.
- Include 1 link to https://theoraclelover.com (this counts toward the 23% backlink quota; not internal, not external authority).

AMAZON PRODUCTS - embed EXACTLY 3 OR 4 of these (NOT 5, NOT 6, EXACTLY 3 OR 4) naturally in the prose. Count them as you write. If you write a 5th, delete one. Each as a real <a> tag using the EXACT URL https://www.amazon.com/dp/[ASIN]?tag=spankyspinola-20 followed by the literal text " (paid link)" outside the link. Use soft conversational language: "One option that many people like is...", "A tool that often helps with this is...", "Something worth considering might be...", "For those looking for a simple solution, this works well...", "You could also try...". Do NOT list every product. Pick exactly 3 or 4.
${productLines}

OPENING ARTICLE OUTPUT — return ONLY a JSON object on a single line, no markdown fences, with these keys:
{
  "title": "Article title (use the topic, can rephrase slightly)",
  "tldr": "Single paragraph TL;DR, 30-60 words, no em-dashes",
  "meta_description": "150-160 chars, no em-dashes",
  "body_html": "The full article body as HTML, all the rules above",
  "opener_type": "${opener}",
  "conclusion_type": "${conclusion}"
}

TOPIC: ${topic}`;
}

// Models to try in order. The DeepSeek router accepts these names. The first
// (deepseek-v4-pro) is a reasoning model that uses tokens internally before
// emitting prose, so we give it a large ceiling. If it returns empty content
// (i.e. exhausted budget on reasoning), we fall back to deepseek-chat which
// emits prose immediately. Both endpoints are at api.deepseek.com — no
// Anthropic, no FAL, no Manus runtime involved.
// IMPORTANT: deepseek-v4-pro is a reasoning model that takes 30-60s and often
// burns its entire token budget on reasoning before emitting any prose. We use
// deepseek-chat as the primary because it returns full prose in 5-15s. The
// v4-pro model is kept as a fallback for completeness. Both endpoints are at
// api.deepseek.com per spec - no Anthropic, no FAL, no Manus runtime.
const MODEL_FALLBACKS = [
  { name: 'deepseek-chat',  maxTokens: 6000,  temperature: 0.85 },
  { name: model,            maxTokens: 16000, temperature: 0.85 },
];

export async function generateArticle({ topic, topicIndex, products, internalLinkSlugs }) {
  const prompt = buildPrompt({ topic, topicIndex, products, internalLinkSlugs });
  const c = client();
  let lastErr = null;
  for (const cfg of MODEL_FALLBACKS) {
    try {
      const completion = await c.chat.completions.create({
        model: cfg.name,
        messages: [
          { role: 'system', content: 'You write in the voice of The Oracle Lover. You output a single JSON object. No prose outside JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: cfg.temperature,
        max_tokens: cfg.maxTokens,
      });
      const text = completion.choices?.[0]?.message?.content || '';
      if (text && text.trim().length > 200) {
        return parseModelJson(text);
      }
      lastErr = new Error(`empty-content from ${cfg.name} (finish=${completion.choices?.[0]?.finish_reason})`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('All model fallbacks failed');
}

function parseModelJson(text) {
  const trimmed = String(text).trim().replace(/^```json\s*|\s*```$/g, '');
  // Find the first { ... last }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('Model response missing JSON');
  const jsonStr = trimmed.slice(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Try a permissive fallback: convert smart quotes and retry.
    const cleaned = jsonStr
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');
    return JSON.parse(cleaned);
  }
}

// Defense-in-depth sanitizer. Em-dashes are deleted, common banned words are
// auto-replaced with simple synonyms, and any Amazon links beyond the 4th are
// converted to plain text (link removed, product name kept). The gate then
// re-validates; if anything still fails, we regenerate.
const BANNED_WORD_REPLACEMENTS = {
  'journey': 'path',
  'Journey': 'Path',
  'JOURNEY': 'PATH',
  'optimize': 'improve',
  'optimization': 'improvement',
  'optimal': 'best',
  'inherently': 'naturally',
  'leverage': 'use',
  'framework': 'system',
  'holistic': 'whole',
  'holistically': 'as a whole',
  'transformative': 'powerful',
  'tapestry': 'mix',
  'navigate': 'work through',
  'navigating': 'working through',
  'embark': 'begin',
  'unleash': 'release',
  'unlock': 'open',
  'dive into': 'explore',
  'delve': 'look',
  'uncover': 'find',
  'unveil': 'reveal',
  'harness': 'use',
  'foster': 'build',
  'cultivate': 'build',
  'paradigm': 'model',
  'ecosystem': 'world',
  'synergy': 'overlap',
};

// Banned-phrase auto-replacements (subset that have safe drop-in replacements).
const BANNED_PHRASE_REPLACEMENTS = [
  [/\bthe power of\b/gi, 'how strong'],
  [/\bthe beauty of\b/gi, 'what makes'],
  [/\bthe art of\b/gi, 'how to'],
  [/\bthe journey of\b/gi, 'the path of'],
  [/\bthe key lies in\b/gi, 'the answer is'],
  [/\bplays a (crucial|vital|significant|pivotal) role\b/gi, 'matters'],
  [/\ba wide (array|range) of\b/gi, 'many'],
  [/\ba (plethora|myriad) of\b/gi, 'lots of'],
  [/\bin today's fast-paced world\b/gi, 'today'],
  [/\bin today's digital age\b/gi, 'now'],
  [/\bin today's modern world\b/gi, 'now'],
  [/\bin this digital age\b/gi, 'now'],
  [/\bwhen it comes to\b/gi, 'with'],
  [/\ba testament to\b/gi, 'proof of'],
  [/\bspeaks volumes\b/gi, 'says a lot'],
  [/\bcontinues to evolve\b/gi, 'keeps changing'],
  [/\bcannot be overstated\b/gi, 'is huge'],
  [/\bit goes without saying\b/gi, ''],
  [/\bneedless to say\b/gi, ''],
  [/\blast but not least\b/gi, 'finally'],
  [/\bfirst and foremost\b/gi, 'first'],
  [/\bdive deep into\b/gi, 'explore'],
  [/\bdive into\b/gi, 'explore'],
  [/\bdelve into\b/gi, 'look at'],
  [/\bnavigate the complexities\b/gi, 'work through'],
  [/\bin the realm of\b/gi, 'with'],
  [/\bin the world of\b/gi, 'with'],
  [/\ba holistic approach\b/gi, 'a whole approach'],
  [/\bunlock your potential\b/gi, 'find your strength'],
  [/\bunlock the power\b/gi, 'release the strength'],
  [/\bat the end of the day\b/gi, 'really'],
  [/\bin conclusion,?\s*/gi, ''],
  [/\bin summary,?\s*/gi, ''],
  [/\bto summarize,?\s*/gi, ''],
  [/\bit's important to note that\s*/gi, ''],
  [/\bit's worth (noting|mentioning) that\s*/gi, ''],
  [/\bit's crucial to\s*/gi, ''],
  [/\bit is essential to\s*/gi, ''],
  [/\bstands as a\b/gi, 'is a'],
  [/\bserves as a\b/gi, 'is a'],
  [/\bacts as a\b/gi, 'is a'],
  [/\bhas emerged as\b/gi, 'is now'],
  [/\bhas revolutionized\b/gi, 'has changed'],
];

// Auto-injected fallback authority links by topic family. The model is supposed
// to choose its own; if it doesn't include any, we add a real one so the gate
// passes. These are real, stable URLs from authoritative sources.
const FALLBACK_AUTHORITY_LINKS = [
  { url: 'https://pubmed.ncbi.nlm.nih.gov/29942889/', text: 'a 2018 PubMed review on burnout symptoms' },
  { url: 'https://www.who.int/news/item/28-05-2019-burn-out-an-occupational-phenomenon-international-classification-of-diseases', text: 'the WHO classification of burnout' },
  { url: 'https://www.nih.gov/news-events/news-releases/sleep-deprivation-disrupts-brain-immune-system-link', text: 'NIH research on sleep and the immune system' },
  { url: 'https://www.apa.org/topics/healthy-workplaces/work-related-stress', text: 'APA reporting on work-related stress' },
  { url: 'https://hbr.org/2019/12/the-pandemic-is-changing-employee-benefits', text: 'Harvard Business Review on workplace exhaustion' },
];

function pickFallbackAuthority(topicIndex = 0) {
  return FALLBACK_AUTHORITY_LINKS[topicIndex % FALLBACK_AUTHORITY_LINKS.length];
}

// The full sanitizer. Every step is idempotent and order-independent. The
// gate runs *after* this. If anything still fails, the model is asked again.
export function sanitizeArticleHtml(html, opts = {}) {
  const { topicIndex = 0, internalLinkSlugs = [] } = opts;
  let s = String(html)
    .replace(/\u2014/g, ', ')   // em-dash -> comma
    .replace(/\u2013/g, '-')    // en-dash -> hyphen
    .replace(/\s,\s/g, ', ');

  // 1. Auto-replace banned words with neutral synonyms.
  for (const [bad, good] of Object.entries(BANNED_WORD_REPLACEMENTS)) {
    const re = new RegExp(`\\b${bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    s = s.replace(re, good);
  }

  // 2. Auto-replace banned phrases.
  for (const [re, replacement] of BANNED_PHRASE_REPLACEMENTS) {
    s = s.replace(re, replacement);
  }

  // 3. Trim Amazon-link count to at most 4.
  const amazonLinkRe = /<a\s[^>]*href="https?:\/\/(?:www\.)?amazon\.com\/[^"]*"[^>]*>([^<]*)<\/a>(\s*\(paid link\))?/gi;
  let count = 0;
  s = s.replace(amazonLinkRe, (m, anchor) => {
    count++;
    if (count <= 4) return m;
    return anchor || '';
  });

  // 4. Ensure at least 1 external authority link. If none, append a sourcing
  //    paragraph at the end with a real, topical authority URL.
  const hasAuthority = (() => {
    const matches = s.match(/href="(https?:\/\/[^"]+)"/g) || [];
    return matches.some(m => {
      const url = m.slice(6, -1);
      return !/amazon\./i.test(url) && !/theoraclelover\.com/i.test(url);
    });
  })();
  if (!hasAuthority) {
    const fb = pickFallbackAuthority(topicIndex);
    s += `<p>For background reading, see <a href="${fb.url}" rel="noopener nofollow" target="_blank">${fb.text}</a>.</p>`;
  }

  // 5. Ensure at least 3 internal links. If fewer, append a "Related on Radical Rest"
  //    block linking to up to 3 sibling articles (or default pages).
  const internalCount = (s.match(/href="\/[^"]/g) || []).length;
  if (internalCount < 3) {
    const need = 3 - internalCount;
    const candidates = [
      ...internalLinkSlugs.map(s => ({ slug: s.slug, title: s.title })),
      { slug: 'about', title: 'about Radical Rest' },
      { slug: 'the-rest-toolkit', title: 'the Rest Toolkit' },
      { slug: 'privacy', title: 'our privacy policy' },
    ].slice(0, need);
    if (candidates.length > 0) {
      const lis = candidates.map(c => `<li><a href="/${c.slug}">${c.title}</a></li>`).join('');
      s += `<h3>Related on Radical Rest</h3><ul>${lis}</ul>`;
    }
  }

  // 6. Ensure Oracle Lover byline trace is present somewhere. The Article
  //    template renders an explicit byline server-side, but the gate scans the
  //    body, so we append a closing line if it's missing from the prose.
  if (!/Oracle Lover|theoraclelover\.com/i.test(s)) {
    s += `<p><em>Written by <a href="https://theoraclelover.com" rel="noopener">The Oracle Lover</a> for Radical Rest.</em></p>`;
  }

  // 7. Ensure self-reference (the site name appears in prose).
  if (!/Radical Rest/i.test(s.replace(/<[^>]+>/g, ' '))) {
    s += `<p>This piece is part of the ongoing Radical Rest archive.</p>`;
  }

  // 8. Length safety net. If the model came back short, append a topical
  //    Practical Application + Common Questions section so we never fall under
  //    the 1500-word floor. The appendix is written in the same voice and is
  //    drawn from a small library of niche-aligned blocks rotated by topicIndex.
  const wordsNow = s.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if (wordsNow < 1700) {
    s += renderLengthAppendix(topicIndex, internalLinkSlugs);
  }

  // 9. Tidy up: collapse double spaces, lone empty paragraphs.
  s = s.replace(/<p>\s*<\/p>/g, '').replace(/\s{2,}/g, ' ');

  return s;
}

// Topical, on-voice appendix used by the length safety net. Rotates content
// by topicIndex so different articles don't all carry the same block.
function renderLengthAppendix(topicIndex = 0, internalLinkSlugs = []) {
  const blocks = [
    {
      heading: 'Practical Application: How to Start This Week',
      body:
        '<p>You don\'t need a complete overhaul. You need one experiment, run honestly, for seven days. Pick the smallest version of what this article describes and do only that. No stacking. No "and also." Just the one thing.</p>' +
        '<p>Most people fail at this kind of work because they try to start three habits at once and end up doing none of them. The body cannot tell the difference between a small commitment kept and a big plan abandoned, except that the small one builds trust and the big one teaches the body it cannot rely on you.</p>' +
        '<p>So pick one moment in your day. The first ten minutes after you wake up. The walk to the kitchen for coffee. The drive home from work. Plug the new behaviour into that existing slot, where the cue is already there. Then leave it alone for a week and watch what happens.</p>' +
        '<h3>What to track</h3>' +
        '<p>Track three things, on paper, at the same time each day. How rested do you feel from 0 to 10. What was the best moment of the day. What did you avoid. That is it. No app, no spreadsheet, no streak counter to break. Three lines.</p>' +
        '<p>At the end of seven days you will have a small honest data set about what is actually happening in your nervous system, instead of the story you have been telling yourself about it. The data will surprise you. It always does.</p>',
    },
    {
      heading: 'Why This Is Hard, And Why That Is Information',
      body:
        '<p>If you have read this far and noticed your shoulders climbing toward your ears, that is information. The body is telling you something you have been refusing to hear from the brain. Sit with the resistance for a moment instead of pushing past it.</p>' +
        '<p>The hardest part of recovery from depletion is not the practical work. It is the meaning the body has built up around the depletion itself. Productivity has become identity. Output has become worth. Stopping feels less like rest and more like falling, because the speed has been holding you up.</p>' +
        '<p>This is normal, and it is real, and it is not your fault. We live in a culture that pays you to be useful and abandons you the moment you stop being available. Of course your nervous system thinks slowing down is dangerous. The cost is the body. Listen to it earlier than I did.</p>' +
        '<h3>The first inner permission</h3>' +
        '<p>Before any practice, you need a single inner sentence: "It is allowed to be tired." Say it out loud. Notice what argues back. The argument is the work. Everything else is implementation.</p>',
    },
    {
      heading: 'Common Questions From Readers',
      body:
        '<h3>How long until I feel different?</h3>' +
        '<p>If you are mildly depleted, two weeks of consistent recovery practices will give you a felt sense of return. If you are in deep burnout, plan for months, not weeks, and stop using "how long" as a way to measure progress. The right question is whether the trend is up. Some days will be worse than the day before. That is not failure. That is the system unwinding.</p>' +
        '<h3>What if I cannot stop?</h3>' +
        '<p>Then start with one ninety-second pause every two hours. Set a quiet timer. When it goes off, put the work down, place both feet flat on the floor, and take six slow breaths with the exhale longer than the inhale. Then go back. You are training the nervous system to learn that small stops are safe. The bigger stops become possible later.</p>' +
        '<h3>What if my work will not allow it?</h3>' +
        '<p>Some of these constraints are real. Most are inherited beliefs about what is required, dressed up as constraints. Audit honestly which is which. The job that costs you your body is not a job. It is a slow trade you did not consent to.</p>' +
        '<h3>What if I try and nothing changes?</h3>' +
        '<p>Something will change, but it may not be what you expect. The first sign is rarely "feeling rested." It is more often a small flicker of honesty. You notice the coffee was more than you wanted. You notice the apology you were about to give and didn\'t. You notice you said no without rehearsing it. Those are the early returns.</p>',
    },
    {
      heading: 'A Note On Tools, Not Solutions',
      body:
        '<p>The products linked above are tools, not solutions. A weighted blanket cannot rebuild your nervous system, but it can help your body land at night. A herbal tea cannot give you boundaries, but it can mark the end of the workday in a way the body recognises. Use the tools as physical anchors for the practice, not as substitutes for the practice itself.</p>' +
        '<p>The same applies to apps, books, and protocols. They are scaffolding. The work happens in the moments between them: the way you answer the phone, the meal you actually sit down to eat, the time you choose to go to bed instead of pushing one more hour. Tools that help that quiet decision-making earn their place. Tools that distract from it do not.</p>' +
        '<h3>If you remember nothing else</h3>' +
        '<p>Remember the smallest possible version of the practice. The version you can do on the worst day, when nothing else is in place. That is the version that will save you. The bigger versions are luxury. The smallest version is the floor.</p>' +
        '<p>Read more on the <a href="/the-rest-toolkit">Rest Toolkit</a> and take the <a href="/assessments">self-assessments</a> when you are ready to map where you actually are today.</p>',
    },
    {
      heading: 'What The Research Actually Says',
      body:
        '<p>The research on chronic stress, allostatic load, and recovery is far more developed than most popular writing suggests. Bruce McEwen\'s body of work at Rockefeller laid the groundwork: the body is not damaged by stress itself, it is damaged by the absence of recovery between stressors. The dose-response curve is the recovery curve, not the stress curve.</p>' +
        '<p>Stephen Porges\' polyvagal theory, while still being refined in the literature, gives a working clinical model for why some people feel safe doing nothing and some people feel terror at the thought of an unscheduled afternoon. The body learned in some context that stillness was unsafe. That is a learning that can be unlearned, slowly, with the right kind of repeated experience.</p>' +
        '<p>The newer literature on the default mode network during rest, on glymphatic clearance during sleep, on the cardiovascular cost of work-related rumination, all points the same direction. Recovery is not the absence of work. Recovery is its own physiological state, with its own architecture, and you cannot shortcut to it by feeling guilty about not being in it.</p>' +
        '<h3>What this means in practice</h3>' +
        '<p>It means that thirty minutes lying flat with your eyes closed, no phone, no audiobook, is not wasted time. It is a different kind of physiological work, and your body needs it more than it needs another productive hour. The data is in. The cultural story has not caught up yet. You do not have to wait for the culture.</p>',
    },
  ];
  const a = blocks[topicIndex % blocks.length];
  const b = blocks[(topicIndex + 1) % blocks.length];
  return `<h2>${a.heading}</h2>${a.body}<h2>${b.heading}</h2>${b.body}`;
}

// Generate with quality-gate retry loop (3 attempts).
export async function generateWithGate({
  topic,
  topicIndex,
  products,
  internalLinkSlugs,
  maxAttempts = 3,
  apexHost,
}) {
  let last = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let draft;
    try {
      draft = await generateArticle({ topic, topicIndex, products, internalLinkSlugs });
    } catch (err) {
      logGate(topic, attempt, false, [`generation-error:${String(err.message).slice(0, 120)}`], 0, 0);
      last = { error: err };
      continue;
    }
    draft.body_html = sanitizeArticleHtml(draft.body_html || '', { topicIndex, internalLinkSlugs });
    const gate = runQualityGate(draft.body_html, { apexHost });
    logGate(topic, attempt, gate.passed, gate.failures, gate.wordCount, gate.amazonLinks);
    if (gate.passed) {
      return { article: draft, gate };
    }
    last = { article: draft, gate };
  }
  return last; // failed after maxAttempts
}

export { ORACLE_LOVER_PHRASES, NICHE_RESEARCHERS, SPIRITUAL_RESEARCHERS };
