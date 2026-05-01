import db from '../src/lib/db.mjs';
import { TOPICS, slugifyTopic } from '../src/data/topics.mjs';

const dupes = db.prepare("SELECT topic_index FROM articles GROUP BY topic_index HAVING COUNT(*) > 1").all();
let removed = 0;
for (const d of dupes) {
  const expected = slugifyTopic(TOPICS[d.topic_index]);
  const rows = db.prepare('SELECT id, slug FROM articles WHERE topic_index=?').all(d.topic_index);
  let keep = rows.find(r => r.slug === expected);
  if (!keep) keep = rows.reduce((a, b) => (a.slug.length >= b.slug.length ? a : b));
  for (const r of rows) {
    if (r.id !== keep.id) {
      db.prepare('DELETE FROM articles WHERE id=?').run(r.id);
      removed++;
    }
  }
}
const total = db.prepare('SELECT COUNT(*) c FROM articles').get().c;
const dist = db.prepare("SELECT status, COUNT(*) c FROM articles GROUP BY status").all();
console.log('removed:', removed);
console.log('total now:', total);
for (const x of dist) console.log(' ', x.status, x.c);
const have = new Set(db.prepare('SELECT topic_index FROM articles').all().map(r => r.topic_index));
const missing = [];
for (let i = 0; i < 500; i++) if (!have.has(i)) missing.push(i);
console.log('missing topic_index count:', missing.length, 'sample:', missing.slice(0, 20));
