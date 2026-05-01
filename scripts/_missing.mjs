import { TOPICS, slugifyTopic } from '../src/data/topics.mjs';
import { getArticleBySlug, countPublishedArticles } from '../src/lib/db.mjs';
const missing = [];
for (let i = 0; i < TOPICS.length; i++) {
  const s = slugifyTopic(TOPICS[i]);
  if (!getArticleBySlug(s)) missing.push(i);
}
console.log('have:', countPublishedArticles());
console.log('missing-count:', missing.length);
console.log('missing-indices:', missing.join(' '));
