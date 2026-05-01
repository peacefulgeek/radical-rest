import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App';
import { SITE } from '../lib/site-config.mjs';

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function render(url: string, data: any) {
  const html = renderToString(
    <StaticRouter location={url}>
      <App data={data} />
    </StaticRouter>
  );

  const title = data.title || SITE.name;
  const desc = data.description || SITE.description;
  const canonical = data.canonical || `${SITE.origin}${url}`;

  const headParts = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(desc)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="${data.route === 'article' ? 'article' : 'website'}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(desc)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE.name)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}" />`,
    `<meta name="theme-color" content="${SITE.colors.bg}" />`,
    `<meta name="author" content="${escapeHtml(SITE.author.name)}" />`,
    `<link rel="alternate" type="application/rss+xml" title="${escapeHtml(SITE.name)}" href="/rss.xml" />`,
  ];

  if (data.article && data.article.hero_image_url) {
    headParts.push(`<meta property="og:image" content="${escapeHtml(data.article.hero_image_url)}" />`);
  }

  if (data.route === 'article' && data.article) {
    const a = data.article;
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.title,
      description: a.tldr,
      author: {
        '@type': 'Person',
        name: SITE.author.name,
        url: SITE.author.link,
      },
      publisher: {
        '@type': 'Organization',
        name: SITE.name,
        url: SITE.origin,
      },
      datePublished: a.published_at,
      dateModified: a.updated_at,
      mainEntityOfPage: canonical,
      image: a.hero_image_url || undefined,
    };
    headParts.push(
      `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`
    );
  }

  if (data.route === 'home') {
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      url: SITE.origin,
      description: SITE.description,
    };
    headParts.push(
      `<script type="application/ld+json">${JSON.stringify(ld)}</script>`
    );
  }

  // Inject server data so the client can hydrate the same view.
  headParts.push(
    `<script>window.__SSR_DATA__=${JSON.stringify(data).replace(/</g, '\\u003c')};</script>`
  );

  return { html, head: headParts.join('\n') };
}
