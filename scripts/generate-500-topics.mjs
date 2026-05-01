#!/usr/bin/env node
// Generate 500 unique, on-niche article topic titles for Radical Rest.
// Uses DeepSeek via OpenAI client. NO Manus, NO Anthropic, NO FAL.
// Output: data/topics-500.json   { topics: [...500 strings], generated_at: ISO }
import OpenAI from 'openai';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { TOPICS as SEED_30 } from '../src/data/topics.mjs';

const OUT = new URL('../data/topics-500.json', import.meta.url);
const TARGET = 500;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.deepseek.com',
});

// Theme buckets to ensure topical diversity across the 500.
const BUCKETS = [
  { name: 'burnout-recovery-protocol', n: 50 },
  { name: 'nervous-system-regulation', n: 45 },
  { name: 'sleep-and-circadian',       n: 40 },
  { name: 'rest-types-and-practices',  n: 40 },
  { name: 'anti-hustle-philosophy',    n: 35 },
  { name: 'somatic-and-body-based',    n: 35 },
  { name: 'workplace-and-career',      n: 35 },
  { name: 'relationships-and-burnout', n: 30 },
  { name: 'parenting-and-caregiver',   n: 30 },
  { name: 'tcm-ayurveda-eastern',      n: 30 },
  { name: 'nutrition-supplements-adrenal', n: 30 },
  { name: 'nature-environment',        n: 25 },
  { name: 'identity-and-meaning',      n: 25 },
  { name: 'recovery-rituals',          n: 25 },
  { name: 'science-and-research',      n: 25 },
];
console.log('total bucket allocation:', BUCKETS.reduce((s,b)=>s+b.n,0));

async function generateBucket(b, existing) {
  const seedSlice = SEED_30.slice(0, 8).map(t => `- ${t}`).join('\n');
  const seenList = existing.length ? '\nALREADY USED (DO NOT REPEAT OR PARAPHRASE):\n' + existing.slice(-60).map(t => `- ${t}`).join('\n') : '';
  const prompt = `You are the Oracle Lover, writing a long-running blog called "Radical Rest" — a sanctuary for burnout recovery, anti-hustle living, nervous-system healing, and the radical art of doing nothing. Voice: warm, slow, intimate, slightly mystical, deeply lived-in. NEVER corporate, NEVER hype, NEVER hustle.

Generate exactly ${b.n} unique article TITLES in the bucket "${b.name}".

Rules:
- Each title is a FULL article title (8-16 words ideal), not a phrase.
- Specific, lived, sensory. Not generic ("How to Rest"). Specific ("How to Rest When Your Nervous System Won't Let You").
- BAN words/phrases: "ultimate guide", "secrets", "hacks", "biohacking", "optimize", "level up", "girlboss", "unlock", "10x", "boss", "crushing it", "manifesting".
- Mix question titles, declarative titles, and case-study titles.
- Each title must be DIFFERENT in concept, not just rewording.
- NO numbering. NO quotes. NO leading dash. ONE title per line. Plain text only.

Aesthetic seed (for tone alignment, do NOT repeat these):
${seedSlice}
${seenList}

Output exactly ${b.n} titles, one per line, nothing else.`;

  const r = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    max_tokens: 4000,
  });
  const text = r.choices[0]?.message?.content || '';
  const lines = text.split('\n').map(l => l.replace(/^[\s\-*0-9.)\]]+/, '').replace(/^["']|["']$/g, '').trim()).filter(Boolean);
  return lines;
}

async function main() {
  let all = [];
  if (existsSync(OUT)) {
    try { all = JSON.parse(readFileSync(OUT, 'utf8')).topics || []; console.log('resuming with', all.length, 'existing'); } catch {}
  }
  // Always seed with the original 30 (already proven on-niche, already generated articles for them)
  for (const t of SEED_30) if (!all.includes(t)) all.push(t);

  const seen = new Set(all.map(t => t.toLowerCase().slice(0, 60)));

  for (const b of BUCKETS) {
    if (all.length >= TARGET) break;
    let needed = b.n;
    let tries = 0;
    while (needed > 0 && tries < 4) {
      tries++;
      console.log(`bucket=${b.name} attempt=${tries} need=${needed} have=${all.length}`);
      try {
        const got = await generateBucket({ ...b, n: Math.min(needed + 5, b.n) }, all);
        let added = 0;
        for (const t of got) {
          const key = t.toLowerCase().slice(0, 60);
          if (!seen.has(key) && t.length > 18 && t.length < 160) {
            seen.add(key); all.push(t); added++; needed--;
            if (all.length >= TARGET) break;
          }
        }
        console.log(`  +${added} (total=${all.length})`);
      } catch (e) {
        console.error(`  err: ${e.message}`);
      }
      writeFileSync(OUT, JSON.stringify({ topics: all.slice(0, TARGET), generated_at: new Date().toISOString() }, null, 2));
      if (all.length >= TARGET) break;
    }
  }

  // Trim to exactly 500
  all = all.slice(0, TARGET);
  writeFileSync(OUT, JSON.stringify({ topics: all, generated_at: new Date().toISOString() }, null, 2));
  console.log('FINAL:', all.length, 'topics written to', OUT.pathname);
}

main().catch(e => { console.error(e); process.exit(1); });
