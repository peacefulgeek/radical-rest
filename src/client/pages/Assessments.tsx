import React, { useState } from 'react';

/* ============================================================
   ASSESSMENT 1 — Burnout Stage Self-Assessment
   12 items, 4-point Likert. Score 0-36 maps to 4 stages.
   ============================================================ */
const BURNOUT_QS = [
  'I wake up already tired, before the day has begun.',
  'I feel cynical about work that used to matter to me.',
  'Small inconveniences set off disproportionate emotion.',
  'I cannot remember the last time I felt genuinely rested.',
  'My body feels heavy, achy, or wired-and-tired.',
  'I have stopped doing the small things that used to bring me joy.',
  'I am drinking more caffeine, sugar, or alcohol than I want to.',
  'My sleep is broken, shallow, or anxious — even when I have time for it.',
  'I feel guilty when I rest and useless when I don\u2019t.',
  'I am performing my life rather than living it.',
  'I have started snapping at the people I love.',
  'I cannot tell anymore what I actually want.',
];
function burnoutStage(total: number) {
  if (total <= 9)  return { label: 'Stable',   color: '#7A9EB1', read: 'Your nervous system is largely regulated. Keep your protective routines in place — sleep, sunlight, real food, the people who know your name. Read \u201cThe 7 Types of Rest You\u2019re Probably Missing\u201d to add depth to what already works.' };
  if (total <= 18) return { label: 'Strained', color: '#9B8EB4', read: 'You are accumulating depletion faster than you are clearing it. This is the stage where most people push through and pay later. Slow down on purpose now, while it is still cheap. Begin with \u201cWhy Self-Care Isn\u2019t Fixing Your Burnout — and What Will.\u201d' };
  if (total <= 27) return { label: 'Burning out', color: '#B5895A', read: 'This is real burnout, not a bad week. The body is asking for structural change, not productivity hacks. Read \u201cBurnout Recovery: The Timeline Nobody Tells You About\u201d and \u201cThe Nervous System of Overwork.\u201d Tell one person you trust today.' };
  return { label: 'Crashed', color: '#A06A4F', read: 'You are in adrenal-floor territory. This is not a moral failing; it is a physiological state. Stop trying to optimise and start protecting. Read \u201cThe Adrenal Crash: What It Feels Like and How to Recover\u201d and consider speaking to a clinician who takes this seriously.' };
}

/* ============================================================
   ASSESSMENT 2 — Which Kind of Rest Do You Actually Need?
   Single-select per dimension. Highest-scoring type wins.
   ============================================================ */
const REST_TYPES = [
  { key: 'physical',  name: 'Physical Rest', desc: 'Your body is the bottleneck. Sleep, breath, stillness, the unmoved couch. Restorative yoga, naps, magnesium, fewer steps. The next layer cannot be built on a body that has not landed.' },
  { key: 'sensory',   name: 'Sensory Rest',  desc: 'Your nervous system is over-stimulated. Less screen, less light, less sound. A walk without earbuds. A meal without a phone. A whole evening with one lamp on.' },
  { key: 'mental',    name: 'Mental Rest',   desc: 'Your thinking-brain is on fire. Brain dump on paper, a real lunch break, micro-pauses every 90 minutes. Stop solving things on your day off.' },
  { key: 'emotional', name: 'Emotional Rest', desc: 'You have been performing wellness for everyone else. You need permission to be honest. One person who lets you be unedited. A short cry. A long bath. Less performing, more presence.' },
  { key: 'social',    name: 'Social Rest',   desc: 'You are tired of being a self for others. Time alone that is not productive. A canceled plan with no apology. A weekend with no input.' },
  { key: 'creative',  name: 'Creative Rest', desc: 'You have been generating without inputting. Art galleries, forests, libraries, music you didn\u2019t pick. Beauty without a deliverable.' },
  { key: 'spiritual', name: 'Spiritual Rest', desc: 'You have lost the sense that any of this means something. Slow morning practice. Reading something old and good. Nature as the cathedral. Reconnecting to what is bigger than the to-do list.' },
];
const REST_QS = [
  { q: 'When you imagine the most relieving moment of the next week, it looks like:',
    a: [
      { t: 'physical',  l: 'Sleeping in with no alarm, in a quiet room.' },
      { t: 'sensory',   l: 'Sitting in a softly lit room with no screens.' },
      { t: 'mental',    l: 'A whole afternoon with nothing to figure out.' },
      { t: 'emotional', l: 'Telling one person the unedited truth.' },
      { t: 'social',    l: 'A canceled plan and an empty house.' },
      { t: 'creative',  l: 'Wandering through a museum or a forest.' },
      { t: 'spiritual', l: 'Sitting somewhere old, slow, and unbothered.' },
    ] },
  { q: 'The thing that depletes you most right now is:',
    a: [
      { t: 'physical',  l: 'How heavy and tired the body feels.' },
      { t: 'sensory',   l: 'The constant noise, light, and notifications.' },
      { t: 'mental',    l: 'The volume of decisions you have to make.' },
      { t: 'emotional', l: 'Holding everyone else\u2019s feelings.' },
      { t: 'social',    l: 'Being needed by too many people.' },
      { t: 'creative',  l: 'Producing without ever consuming beauty.' },
      { t: 'spiritual', l: 'Doing a lot that does not feel meaningful.' },
    ] },
  { q: 'After a \u201crelaxing\u201d weekend you still feel:',
    a: [
      { t: 'physical',  l: 'Bone tired. The body did not actually land.' },
      { t: 'sensory',   l: 'Wired. Eyes hurt. Brain hums.' },
      { t: 'mental',    l: 'Behind. The list grew while you sat down.' },
      { t: 'emotional', l: 'Hollow. You performed rest for the people around you.' },
      { t: 'social',    l: 'Drained. There were too many people in the day.' },
      { t: 'creative',  l: 'Flat. You scrolled instead of made.' },
      { t: 'spiritual', l: 'Empty. None of it added up to anything.' },
    ] },
  { q: 'The kind of moment you secretly crave is:',
    a: [
      { t: 'physical',  l: 'A long sleep in a cool dark room.' },
      { t: 'sensory',   l: 'A walk with no earbuds and no phone.' },
      { t: 'mental',    l: 'A day where nobody asks you a single question.' },
      { t: 'emotional', l: 'A friend who lets you be a mess for an hour.' },
      { t: 'social',    l: 'A whole day where you don\u2019t see another human.' },
      { t: 'creative',  l: 'An afternoon in a bookshop or a gallery.' },
      { t: 'spiritual', l: 'A morning that feels sacred without a name for it.' },
    ] },
];

/* ============================================================
   ASSESSMENT 3 — Nervous System State Right Now
   Quick polyvagal snapshot, 6 questions, branchy.
   ============================================================ */
const NS_QS = [
  { q: 'In your body right now you mostly notice:',
    a: [
      { t: 'ventral',   l: 'A soft warmth in the chest, slow steady breath.' },
      { t: 'sympathetic', l: 'Tightness in chest or jaw, a faint hum of urgency.' },
      { t: 'dorsal',    l: 'Heaviness, distance, like watching from inside glass.' },
      { t: 'mixed',     l: 'A wired-and-tired feeling, both pushed and pulled.' },
    ] },
  { q: 'Your breath right now is:',
    a: [
      { t: 'ventral',   l: 'Even, low, easy.' },
      { t: 'sympathetic', l: 'Shallow, in the upper chest.' },
      { t: 'dorsal',    l: 'Slow, almost forgotten.' },
      { t: 'mixed',     l: 'You only just realized you were holding it.' },
    ] },
  { q: 'When you imagine answering one more message:',
    a: [
      { t: 'ventral',   l: 'Fine. You can take it or leave it.' },
      { t: 'sympathetic', l: 'A spike of pressure or annoyance.' },
      { t: 'dorsal',    l: 'You go blank. You can\u2019t face it.' },
      { t: 'mixed',     l: 'You both want to scream and to disappear.' },
    ] },
  { q: 'Your relationship with food today has been:',
    a: [
      { t: 'ventral',   l: 'You ate when hungry, stopped when full.' },
      { t: 'sympathetic', l: 'You forgot meals, then ate fast.' },
      { t: 'dorsal',    l: 'You did not really want to eat.' },
      { t: 'mixed',     l: 'You ate to soothe, then felt worse.' },
    ] },
  { q: 'Sleep last night was:',
    a: [
      { t: 'ventral',   l: 'Deep, continuous, rested on waking.' },
      { t: 'sympathetic', l: 'Anxious, shallow, woke at 3am wired.' },
      { t: 'dorsal',    l: 'Long but unrefreshing, hard to get up.' },
      { t: 'mixed',     l: 'Some hours wired, some hours leaden.' },
    ] },
  { q: 'The thought of another person right now feels:',
    a: [
      { t: 'ventral',   l: 'Welcome. You\u2019d enjoy a slow conversation.' },
      { t: 'sympathetic', l: 'Like one more demand on a depleted system.' },
      { t: 'dorsal',    l: 'Like more than you can imagine doing.' },
      { t: 'mixed',     l: 'Both wanted and unbearable.' },
    ] },
];
const NS_STATES: Record<string, { name: string; color: string; read: string }> = {
  ventral:    { name: 'Ventral Vagal — Safe & Social',
    color: '#7A9EB1',
    read: 'You are in the regulated state the body was built for. Conversation, food, and sleep are doing their job. This is rare and worth protecting. Notice what got you here today and write it down. Read \u201cRest Is Not Laziness\u201d to deepen the practice.' },
  sympathetic:{ name: 'Sympathetic — Mobilized / On',
    color: '#A06A4F',
    read: 'Your system is in low-grade fight-or-flight, even with no real threat. The fix is not motivation; it is physiology. Long exhale breath, weight on the body, one slow walk outside, and protect tonight\u2019s sleep. Read \u201cThe Nervous System of Overwork.\u201d' },
  dorsal:     { name: 'Dorsal Vagal — Shutdown / Freeze',
    color: '#9B8EB4',
    read: 'Your system has gone into shutdown to protect itself. This is not laziness; it is biology. Tiny gentle movement, sunlight on the face, warmth, and a single low-stakes call to a person who lets you be quiet. Read \u201cThe Adrenal Crash: What It Feels Like and How to Recover.\u201d' },
  mixed:      { name: 'Mixed — Wired & Tired',
    color: '#B5895A',
    read: 'You are running fight-or-flight on top of an exhausted system. The wired layer hides the depletion underneath. Pull the wired layer off first — caffeine cap, screen cap, one slow exhale practice — then let the tired underneath finally land. Read \u201cWhy Self-Care Isn\u2019t Fixing Your Burnout.\u201d' },
};

/* ============================================================
   ASSESSMENT 4 — Recovery Readiness (start-of-day check-in)
   5 sliders, summed for a single readiness number.
   ============================================================ */
const READY_QS = [
  { q: 'How rested do you feel right now?',          low: 'Not at all', high: 'Fully' },
  { q: 'How regulated does your body feel?',         low: 'Wired/numb', high: 'Calm' },
  { q: 'How much capacity do you have for others?',  low: 'None',       high: 'Full' },
  { q: 'How clearly can you think today?',           low: 'Foggy',      high: 'Sharp' },
  { q: 'How honest could you be with yourself today?', low: 'Avoiding', high: 'Open' },
];
function readinessRead(total: number) {
  // 5 questions x 0-10 = 0-50
  if (total >= 40) return { label: 'High readiness', color: '#7A9EB1', read: 'Use this day on purpose. Choose work that matters and finish a thing you have been avoiding. Then guard the recovery.' };
  if (total >= 25) return { label: 'Mid readiness',  color: '#9B8EB4', read: 'Pick one priority. Do not stack three. Plan one small recovery before lunch — a walk without your phone, a meal at the table.' };
  if (total >= 10) return { label: 'Low readiness',  color: '#B5895A', read: 'This is a recovery day pretending to be a workday. Move what is moveable. Honour the quietest possible version of the day. Tonight, an early dark room.' };
  return { label: 'Depleted',                        color: '#A06A4F', read: 'You are below the line. Cancel what can be cancelled. Eat a real meal. Lie flat for twenty minutes. The day is for repair, not output.' };
}

/* ============================================================
   PAGE
   ============================================================ */
export default function Assessments() {
  return (
    <article className="rr-page">
      <header className="rr-page-head">
        <h1 className="rr-page-title">Self-Assessments</h1>
        <p className="rr-page-lede">
          Four quick check-ins for the depleted. Nothing you fill in is sent
          anywhere. Every assessment runs in your browser, and the only thing
          that leaves your device is the part you decide to act on.
        </p>
      </header>

      <BurnoutAssessment />
      <RestTypeAssessment />
      <NervousSystemAssessment />
      <ReadinessAssessment />

      <section className="rr-page-foot">
        <h2>What to do next</h2>
        <p>
          Whichever result surfaced, the next move is not a productivity hack.
          It is the smallest version of recovery you can actually do today.
          Start with one of these:
        </p>
        <ul>
          <li><a href="/youre-not-tired-youre-burned-out-heres-the-difference">You\u2019re Not Tired. You\u2019re Burned Out. Here\u2019s the Difference.</a></li>
          <li><a href="/the-7-types-of-rest-youre-probably-missing">The 7 Types of Rest You\u2019re Probably Missing</a></li>
          <li><a href="/the-nervous-system-of-overwork-what-hustle-actually-does-to-your-body">The Nervous System of Overwork</a></li>
          <li><a href="/burnout-recovery-the-timeline-nobody-tells-you-about">Burnout Recovery: The Timeline Nobody Tells You About</a></li>
          <li><a href="/the-rest-toolkit">The Rest Toolkit</a></li>
        </ul>
      </section>
    </article>
  );
}

/* ----- BURNOUT WIDGET ----- */
function BurnoutAssessment() {
  const [vals, setVals] = useState<number[]>(Array(BURNOUT_QS.length).fill(-1));
  const [submitted, setSubmitted] = useState(false);
  const total = vals.reduce((s, v) => s + Math.max(0, v), 0);
  const answered = vals.filter((v) => v >= 0).length;
  const result = burnoutStage(total);
  return (
    <section className="rr-quiz">
      <h2>Burnout Stage Self-Assessment</h2>
      <p className="rr-quiz-sub">Twelve statements. For each, choose how true it feels in the last two weeks.</p>
      <ol className="rr-quiz-list">
        {BURNOUT_QS.map((q, i) => (
          <li key={i} className="rr-quiz-item">
            <p className="rr-quiz-q">{q}</p>
            <div className="rr-quiz-row">
              {['Not at all', 'A little', 'A lot', 'Constantly'].map((label, v) => (
                <label key={v} className={`rr-pill ${vals[i] === v ? 'on' : ''}`}>
                  <input
                    type="radio"
                    name={`b${i}`}
                    checked={vals[i] === v}
                    onChange={() => {
                      const next = vals.slice(); next[i] = v; setVals(next);
                    }}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <button
        className="rr-quiz-submit"
        disabled={answered < BURNOUT_QS.length}
        onClick={() => setSubmitted(true)}
      >
        {answered < BURNOUT_QS.length ? `Answer all ${BURNOUT_QS.length} (${answered}/${BURNOUT_QS.length})` : 'See my stage'}
      </button>
      {submitted && (
        <div className="rr-quiz-result" style={{ borderColor: result.color }}>
          <div className="rr-result-label" style={{ color: result.color }}>{result.label}</div>
          <div className="rr-result-score">Score {total} of {BURNOUT_QS.length * 3}</div>
          <p className="rr-result-read">{result.read}</p>
        </div>
      )}
    </section>
  );
}

/* ----- REST-TYPE WIDGET ----- */
function RestTypeAssessment() {
  const [picks, setPicks] = useState<string[]>(Array(REST_QS.length).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const tally: Record<string, number> = {};
  picks.forEach((p) => { if (p) tally[p] = (tally[p] || 0) + 1; });
  const winner = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
  const winType = REST_TYPES.find((t) => t.key === winner);
  const answered = picks.filter(Boolean).length;
  return (
    <section className="rr-quiz">
      <h2>Which Kind of Rest Do You Actually Need?</h2>
      <p className="rr-quiz-sub">Four questions. Pick the most honest answer, even if more than one is partly true.</p>
      <ol className="rr-quiz-list">
        {REST_QS.map((q, i) => (
          <li key={i} className="rr-quiz-item">
            <p className="rr-quiz-q">{q.q}</p>
            <div className="rr-quiz-col">
              {q.a.map((opt, j) => (
                <label key={j} className={`rr-pill rr-pill-block ${picks[i] === opt.t ? 'on' : ''}`}>
                  <input
                    type="radio"
                    name={`r${i}`}
                    checked={picks[i] === opt.t}
                    onChange={() => {
                      const next = picks.slice(); next[i] = opt.t; setPicks(next);
                    }}
                  />
                  <span>{opt.l}</span>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <button
        className="rr-quiz-submit"
        disabled={answered < REST_QS.length}
        onClick={() => setSubmitted(true)}
      >
        {answered < REST_QS.length ? `Answer all ${REST_QS.length} (${answered}/${REST_QS.length})` : 'Reveal my rest type'}
      </button>
      {submitted && winType && (
        <div className="rr-quiz-result" style={{ borderColor: '#7A9EB1' }}>
          <div className="rr-result-label" style={{ color: '#7A9EB1' }}>{winType.name}</div>
          <p className="rr-result-read">{winType.desc}</p>
        </div>
      )}
    </section>
  );
}

/* ----- NERVOUS-SYSTEM WIDGET ----- */
function NervousSystemAssessment() {
  const [picks, setPicks] = useState<string[]>(Array(NS_QS.length).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const tally: Record<string, number> = {};
  picks.forEach((p) => { if (p) tally[p] = (tally[p] || 0) + 1; });
  const winner = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
  const result = winner ? NS_STATES[winner] : null;
  const answered = picks.filter(Boolean).length;
  return (
    <section className="rr-quiz">
      <h2>Nervous System State — Right Now</h2>
      <p className="rr-quiz-sub">A six-question polyvagal snapshot. Read each prompt slowly and answer for the last fifteen minutes, not your idea of yourself.</p>
      <ol className="rr-quiz-list">
        {NS_QS.map((q, i) => (
          <li key={i} className="rr-quiz-item">
            <p className="rr-quiz-q">{q.q}</p>
            <div className="rr-quiz-col">
              {q.a.map((opt, j) => (
                <label key={j} className={`rr-pill rr-pill-block ${picks[i] === opt.t ? 'on' : ''}`}>
                  <input
                    type="radio"
                    name={`ns${i}`}
                    checked={picks[i] === opt.t}
                    onChange={() => {
                      const next = picks.slice(); next[i] = opt.t; setPicks(next);
                    }}
                  />
                  <span>{opt.l}</span>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <button
        className="rr-quiz-submit"
        disabled={answered < NS_QS.length}
        onClick={() => setSubmitted(true)}
      >
        {answered < NS_QS.length ? `Answer all ${NS_QS.length} (${answered}/${NS_QS.length})` : 'See my state'}
      </button>
      {submitted && result && (
        <div className="rr-quiz-result" style={{ borderColor: result.color }}>
          <div className="rr-result-label" style={{ color: result.color }}>{result.name}</div>
          <p className="rr-result-read">{result.read}</p>
        </div>
      )}
    </section>
  );
}

/* ----- READINESS WIDGET ----- */
function ReadinessAssessment() {
  const [vals, setVals] = useState<number[]>(Array(READY_QS.length).fill(5));
  const [submitted, setSubmitted] = useState(false);
  const total = vals.reduce((s, v) => s + v, 0);
  const result = readinessRead(total);
  return (
    <section className="rr-quiz">
      <h2>Today\u2019s Recovery Readiness</h2>
      <p className="rr-quiz-sub">Five sliders. Move each to the most honest spot. The number on the right is just the read — the words are what matter.</p>
      <ol className="rr-quiz-list">
        {READY_QS.map((q, i) => (
          <li key={i} className="rr-quiz-item">
            <p className="rr-quiz-q">{q.q}</p>
            <div className="rr-slider-row">
              <span className="rr-slider-end">{q.low}</span>
              <input
                type="range" min={0} max={10} value={vals[i]}
                onChange={(e) => {
                  const next = vals.slice(); next[i] = Number(e.target.value); setVals(next);
                }}
              />
              <span className="rr-slider-end">{q.high}</span>
              <span className="rr-slider-val">{vals[i]}</span>
            </div>
          </li>
        ))}
      </ol>
      <button className="rr-quiz-submit" onClick={() => setSubmitted(true)}>
        {submitted ? 'Re-read my day' : 'See today\u2019s read'}
      </button>
      {submitted && (
        <div className="rr-quiz-result" style={{ borderColor: result.color }}>
          <div className="rr-result-label" style={{ color: result.color }}>{result.label}</div>
          <div className="rr-result-score">Readiness {total} of {READY_QS.length * 10}</div>
          <p className="rr-result-read">{result.read}</p>
        </div>
      )}
    </section>
  );
}
