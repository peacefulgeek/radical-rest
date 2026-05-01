import React from 'react';
import { SITE } from '../../lib/site-config.mjs';

function fmtDateTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function Article({ data }: { data: any }) {
  const a = data.article;
  const siblings: any[] = data.siblings || [];

  return (
    <>
      <aside className="rr-share" aria-label="Share">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(SITE.origin + '/' + a.slug)}&text=${encodeURIComponent(a.title)}`}
          target="_blank" rel="noopener" title="Share on X"
        >X</a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE.origin + '/' + a.slug)}`}
          target="_blank" rel="noopener" title="Share on Facebook"
        >f</a>
        <a
          href={`mailto:?subject=${encodeURIComponent(a.title)}&body=${encodeURIComponent(SITE.origin + '/' + a.slug)}`}
          title="Email"
        >@</a>
      </aside>

      <article className="rr-article">
        <h1>{a.title}</h1>
        <p className="rr-byline">
          By{' '}
          <a href={SITE.author.link} target="_blank" rel="noopener nofollow">
            {SITE.author.name}
          </a>{' '}
          · <time dateTime={a.published_at}>{fmtDateTime(a.published_at)}</time>
          {a.word_count ? <> · {a.word_count} words</> : null}
        </p>

        {a.hero_image_url ? (
          <img
            src={a.hero_image_url}
            alt={a.title}
            loading="eager"
            width={1200} height={628}
            style={{ width: '100%', height: 'auto', borderRadius: 6, margin: '8px 0 24px' }}
          />
        ) : null}

        <div className="rr-tldr">
          <strong>TL;DR.</strong> {a.tldr}
        </div>

        <p className="rr-article-disclosure">{SITE.amazon.disclosure}</p>

        <div dangerouslySetInnerHTML={{ __html: a.body_html }} />

        {siblings.length ? (
          <div className="rr-internal-links">
            <h3>{SITE.bottomSectionLabel}</h3>
            {siblings.slice(0, 5).map((s) => (
              <a key={s.slug} href={`/${s.slug}`}>{s.title}</a>
            ))}
          </div>
        ) : null}

        <div className="rr-bio-bottom">
          <h4>About the author</h4>
          <p>
            {SITE.author.bio} More writing, oracle work, and live readings at{' '}
            <a href={SITE.author.link} target="_blank" rel="noopener nofollow">
              theoraclelover.com
            </a>.
          </p>
        </div>
      </article>
    </>
  );
}
