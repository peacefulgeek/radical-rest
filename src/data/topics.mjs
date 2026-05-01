// src/data/topics.mjs
// 30 article topics from the per-site scope.

export const TOPICS = [
  "You're Not Tired. You're Burned Out. Here's the Difference.",
  "The 7 Types of Rest You're Probably Missing",
  "Why Self-Care Isn't Fixing Your Burnout (And What Will)",
  "The Nervous System of Overwork: What Hustle Actually Does to Your Body",
  "Rest Is Not Laziness: The Case for Doing Nothing",
  "How to Take a Sabbatical (Even If You Can't Afford One)",
  "Burnout Recovery: The Timeline Nobody Tells You About",
  "The Adrenal Crash: What It Feels Like and How to Recover",
  "Why High Achievers Burn Out the Hardest",
  "The TCM View of Burnout: Kidney Deficiency and Jing Depletion",
  "How to Rest When Your Nervous System Won't Let You",
  "The Guilt of Doing Nothing (And How to Dissolve It)",
  "Digital Detox as Rest Practice: What the Research Shows",
  "Burnout and Identity: When You Don't Know Who You Are Without Work",
  "Sleep as the Foundation: Why You Can't Rest Your Way Out of Sleep Debt",
  "The Corporate Wellness Lie: Why Your Company's Wellness Program Won't Save You",
  "How to Have the Burnout Conversation With Your Employer",
  "Supplements for Adrenal Recovery: What Works and What's Hype",
  "Restorative Yoga vs Regular Yoga: Why the Distinction Matters",
  "The Art of the Nap: Science-Backed Napping Protocols",
  "Burnout and Relationships: When You Have Nothing Left to Give",
  "How to Reenter Life After Burnout (Without Burning Out Again)",
  "The Anti-Hustle Morning: A Rest-Based Start to the Day",
  "Ayurvedic Burnout Recovery: Rebuilding Ojas",
  "When Rest Surfaces Grief: What Happens When You Finally Stop",
  "Boundaries as Rest: Why Saying No Is a Physical Practice",
  "The Financial Side of Burnout: What It Actually Costs You",
  "Nature as Medicine: The Science of Green Rest",
  "Burnout in Parents: The Rest You Can't Take",
  "Your Rest Protocol: Building a Sustainable Rhythm",
];

export function slugifyTopic(t) {
  return String(t)
    .toLowerCase()
    .replace(/['’,():.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
}
