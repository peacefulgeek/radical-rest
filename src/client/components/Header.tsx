import React from 'react';
import { SITE } from '../../lib/site-config.mjs';

export default function Header() {
  return (
    <header className="rr-header">
      <div className="rr-header-inner">
        <a className="rr-brand" href="/">{SITE.name}</a>
        <nav className="rr-nav">
          <a href="/">Home</a>
          <a href="/assessments">Assessments</a>
          <a href={`/${SITE.toolsPageSlug}`}>Toolkit</a>
          <a href="/about">About</a>
        </nav>
      </div>
    </header>
  );
}
