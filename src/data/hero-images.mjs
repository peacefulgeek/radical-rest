// src/data/hero-images.mjs
// Per-article hero image manifest. The CDN base host is read from
// SITE.bunny.cdnHost (env-overridable). Each entry maps a topic slug to a
// unique, on-brand WebP filename on the Bunny zone. Once images are uploaded
// to Bunny under /heroes/{filename}.webp the URLs work immediately. Until
// then, the alt-text and OG metadata are correct and the <img> still resolves
// to a deterministic, cacheable URL.
//
// Naming convention: kebab-case slug + numeric suffix matching topic order.
// Image style guide (for the post-build upload pass):
//   - 1600x900, 16:9
//   - Soft natural-light photography
//   - Muted sage / warm off-white palette to match SITE.colors
//   - No people's faces
//   - Subjects: linen sheets, slow-light bedrooms, cups of tea on side
//     tables, open windows, candles, pillows, ferns, hands holding a book,
//     unmade beds, daylight on wood floors, eye masks, wrinkled cotton.

import { bunnyImage } from '../lib/site-config.mjs';

export const HERO_IMAGES = {
  'youre-not-tired-youre-burned-out-heres-the-difference': {
    file: 'heroes/01-burnout-vs-tired.webp',
    alt: 'Soft morning light falling across rumpled white linen sheets and a half-finished cup of tea',
  },
  'the-7-types-of-rest-youre-probably-missing': {
    file: 'heroes/02-seven-types-of-rest.webp',
    alt: 'Seven smooth river stones arranged on a pale linen surface in soft natural light',
  },
  'why-self-care-isnt-fixing-your-burnout-and-what-will': {
    file: 'heroes/03-self-care-isnt-fixing-it.webp',
    alt: 'A scattered face mask, candle, and journal on a bedside table at dusk',
  },
  'the-nervous-system-of-overwork-what-hustle-actually-does-to-your-body': {
    file: 'heroes/04-nervous-system-overwork.webp',
    alt: 'A delicate fern unfurling against a soft grey wall in low natural light',
  },
  'rest-is-not-laziness-the-case-for-doing-nothing': {
    file: 'heroes/05-rest-is-not-laziness.webp',
    alt: 'An empty hammock swaying between two trees in dappled afternoon light',
  },
  'how-to-take-a-sabbatical-even-if-you-cant-afford-one': {
    file: 'heroes/06-affordable-sabbatical.webp',
    alt: 'A small open suitcase with a folded sweater, a book, and a journal beside it',
  },
  'burnout-recovery-the-timeline-nobody-tells-you-about': {
    file: 'heroes/07-recovery-timeline.webp',
    alt: 'A vintage wall calendar with soft sunlight crossing the page',
  },
  'the-adrenal-crash-what-it-feels-like-and-how-to-recover': {
    file: 'heroes/08-adrenal-crash.webp',
    alt: 'A cup of warm broth on a wooden tray beside a folded wool blanket',
  },
  'why-high-achievers-burn-out-the-hardest': {
    file: 'heroes/09-high-achievers-burnout.webp',
    alt: 'A closed laptop, a half-empty coffee cup, and a single yellow leaf on a desk',
  },
  'the-tcm-view-of-burnout-kidney-deficiency-and-jing-depletion': {
    file: 'heroes/10-tcm-jing-depletion.webp',
    alt: 'A teapot of dark herbal tea steeping on a wooden surface in warm light',
  },
  'how-to-rest-when-your-nervous-system-wont-let-you': {
    file: 'heroes/11-cant-rest-nervous-system.webp',
    alt: 'A weighted blanket folded on a low bed in a pale, sunlit room',
  },
  'the-guilt-of-doing-nothing-and-how-to-dissolve-it': {
    file: 'heroes/12-guilt-of-doing-nothing.webp',
    alt: 'An empty wooden chair beside a window with sheer curtains catching the breeze',
  },
  'digital-detox-as-rest-practice-what-the-research-shows': {
    file: 'heroes/13-digital-detox.webp',
    alt: 'A phone face-down on a wooden table beside a paperback novel and a steaming mug',
  },
  'burnout-and-identity-when-you-dont-know-who-you-are-without-work': {
    file: 'heroes/14-burnout-and-identity.webp',
    alt: 'A cracked-open journal with a fountain pen resting on the page',
  },
  'sleep-as-the-foundation-why-you-cant-rest-your-way-out-of-sleep-debt': {
    file: 'heroes/15-sleep-debt.webp',
    alt: 'A simple bed with crisp white sheets in a quiet room at first light',
  },
  'the-corporate-wellness-lie-why-your-companys-wellness-program-wont-save-you': {
    file: 'heroes/16-corporate-wellness-lie.webp',
    alt: 'A row of empty kombucha bottles on a sterile office breakroom counter',
  },
  'how-to-have-the-burnout-conversation-with-your-employer': {
    file: 'heroes/17-burnout-conversation.webp',
    alt: 'Two coffee cups on a small round table by a window in soft afternoon light',
  },
  'supplements-for-adrenal-recovery-what-works-and-whats-hype': {
    file: 'heroes/18-adrenal-supplements.webp',
    alt: 'A small amber glass bottle and a pile of dried roots on a linen napkin',
  },
  'restorative-yoga-vs-regular-yoga-why-the-distinction-matters': {
    file: 'heroes/19-restorative-yoga.webp',
    alt: 'A folded wool blanket and a yoga bolster on a wooden floor in warm light',
  },
  'the-art-of-the-nap-science-backed-napping-protocols': {
    file: 'heroes/20-art-of-the-nap.webp',
    alt: 'A linen pillow and an eye mask on rumpled bedding in afternoon shadow',
  },
  'burnout-and-relationships-when-you-have-nothing-left-to-give': {
    file: 'heroes/21-burnout-and-relationships.webp',
    alt: 'Two empty teacups side by side on a worn wooden table',
  },
  'how-to-reenter-life-after-burnout-without-burning-out-again': {
    file: 'heroes/22-reentering-life.webp',
    alt: 'An open front door with sunlight pouring across a wooden threshold',
  },
  'the-anti-hustle-morning-a-rest-based-start-to-the-day': {
    file: 'heroes/23-anti-hustle-morning.webp',
    alt: 'A slow morning scene: a kettle, a mug, and a window full of sunrise',
  },
  'ayurvedic-burnout-recovery-rebuilding-ojas': {
    file: 'heroes/24-ayurvedic-ojas.webp',
    alt: 'A small bowl of golden ghee beside spices on a stone surface',
  },
  'when-rest-surfaces-grief-what-happens-when-you-finally-stop': {
    file: 'heroes/25-rest-surfaces-grief.webp',
    alt: 'A single hand resting on a folded wool blanket near a sunlit window',
  },
  'boundaries-as-rest-why-saying-no-is-a-physical-practice': {
    file: 'heroes/26-boundaries-as-rest.webp',
    alt: 'A closed wooden door with a brass handle in soft natural light',
  },
  'the-financial-side-of-burnout-what-it-actually-costs-you': {
    file: 'heroes/27-financial-cost-burnout.webp',
    alt: 'A closed leather wallet and a notebook on a quiet wooden desk',
  },
  'nature-as-medicine-the-science-of-green-rest': {
    file: 'heroes/28-nature-as-medicine.webp',
    alt: 'A forest path in dappled green light filtered through tall trees',
  },
  'burnout-in-parents-the-rest-you-cant-take': {
    file: 'heroes/29-parental-burnout.webp',
    alt: 'A child\u2019s small toy on a couch beside a folded blanket and a half-read book',
  },
  'your-rest-protocol-building-a-sustainable-rhythm': {
    file: 'heroes/30-rest-protocol.webp',
    alt: 'A simple weekly planner and a pencil on a clean wooden desk in morning light',
  },
};

// Default image is used if a slug is missing from the manifest (it should not
// happen, but we never want to render an article without a hero).
const DEFAULT = {
  file: 'heroes/00-default.webp',
  alt: 'Soft morning light across white linen \u2014 the visual signature of Radical Rest',
};

export function heroImageFor(slug) {
  const entry = HERO_IMAGES[slug] || DEFAULT;
  return {
    url: bunnyImage(entry.file),
    alt: entry.alt,
  };
}

export function heroImageList() {
  return Object.entries(HERO_IMAGES).map(([slug, e]) => ({
    slug, file: e.file, alt: e.alt, url: bunnyImage(e.file),
  }));
}
