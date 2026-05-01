import React from 'react';
import { SITE } from '../../lib/site-config.mjs';

export default function Footer() {
  return (
    <>
      <footer className="rr-footer">
        <div>{SITE.amazon.disclosure}</div>
        <div style={{ marginTop: 8 }}>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href={`/${SITE.toolsPageSlug}`}>{SITE.toolsPageName}</a>
          <a href="/privacy">Privacy</a>
          <a href="/rss.xml">RSS</a>
        </div>
        <div style={{ marginTop: 12 }}>
          © {new Date().getFullYear()} {SITE.name}. Written by{' '}
          <a href={SITE.author.link} target="_blank" rel="noopener nofollow">
            {SITE.author.name}
          </a>.
        </div>
      </footer>
      <nav className="rr-mobile-nav" aria-label="Mobile navigation">
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href={`/${SITE.toolsPageSlug}`}>Toolkit</a>
      </nav>
    </>
  );
}
