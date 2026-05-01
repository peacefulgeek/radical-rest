import React from 'react';
import { SITE } from '../../lib/site-config.mjs';
// Use a curated subset for the public Toolkit page. The full catalog (used by
// the affiliate injector) lives in src/data/product-catalog.mjs.
import { TOOLKIT_FEATURED } from '../../data/toolkit-featured.mjs';

function amazonUrl(asin: string) {
  return `https://www.amazon.com/dp/${asin}?tag=${SITE.amazon.tag}`;
}

export default function Tools() {
  return (
    <article className="rr-article">
      <h1>{SITE.toolsPageName}</h1>
      <p className="rr-byline">
        Curated by{' '}
        <a href={SITE.author.link} target="_blank" rel="noopener nofollow">
          {SITE.author.name}
        </a>
      </p>

      <p className="rr-article-disclosure">{SITE.amazon.disclosure}</p>

      <p>
        These are the tools, books, and supplements that show up most often in
        burnout recovery. Not every item is for every person. Pick what fits
        the layer of rest you are missing right now. Sleep first. Adrenal
        support second. Practices third.
      </p>

      {TOOLKIT_FEATURED.map((cat: any) => (
        <section key={cat.category}>
          <h2>{cat.category}</h2>
          <ul>
            {cat.items.map((p: any) => (
              <li key={p.asin}>
                <a href={amazonUrl(p.asin)} target="_blank" rel="noopener nofollow sponsored">
                  {p.name}
                </a>{' '}
                <span style={{ color: 'var(--rr-muted)', fontSize: 13 }}>(paid link)</span>
                {p.note ? <div style={{ color: 'var(--rr-muted)', fontSize: 14 }}>{p.note}</div> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p style={{ marginTop: 32, color: 'var(--rr-muted)', fontSize: 14 }}>
        All Amazon links use my associate tag. Clicking does not change your
        price. It does help fund the writing here.
      </p>
    </article>
  );
}
