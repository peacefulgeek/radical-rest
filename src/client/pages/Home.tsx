import React from 'react';
import { SITE } from '../../lib/site-config.mjs';

function fmtDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Home({ data }: { data: any }) {
  const articles = data.articles || [];
  return (
    <div>
      <h1 className="rr-tagline">{SITE.tagline}</h1>
      <p className="rr-lede">{SITE.description}</p>
      <ul className="rr-list">
        {articles.map((a: any) => (
          <li key={a.slug}>
            <a href={`/${a.slug}`}>{a.title}</a>
            <span className="rr-meta">
              {fmtDate(a.published_at)} · {a.word_count} words
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
