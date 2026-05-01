import React from 'react';
import { SITE } from '../../lib/site-config.mjs';

export default function Privacy() {
  return (
    <article className="rr-article">
      <h1>Privacy Policy</h1>

      <h2>What we collect</h2>
      <p>
        {SITE.name} does not collect personal data through forms or accounts.
        Standard server logs (IP, user agent, request path, timestamp) are
        retained for 30 days for security and traffic analysis. We do not sell
        or share these logs.
      </p>

      <h2>Cookies and analytics</h2>
      <p>
        The site uses minimal first-party cookies for session continuity only.
        We do not run third-party tracking pixels. No Cloudflare. No
        cross-site advertising trackers.
      </p>

      <h2>Affiliate disclosure</h2>
      <p>
        {SITE.name} participates in the Amazon Services LLC Associates Program,
        an affiliate advertising program designed to provide a means for sites
        to earn advertising fees by advertising and linking to Amazon.com.
      </p>
      <p>
        When you click an Amazon link on this site and make a purchase, we may
        earn a commission at no additional cost to you. {SITE.amazon.disclosure}
      </p>
      <p>
        Every Amazon link is followed by the text <em>(paid link)</em> in plain
        view. We only link to products we believe are genuinely useful for the
        topic at hand. We do not accept payment for placement.
      </p>

      <h2>Health disclaimer</h2>
      <p>
        Content on {SITE.name} is for educational and informational purposes
        only. It is not medical advice. Burnout, adrenal fatigue, sleep
        disorders, anxiety, depression, and physical exhaustion can have many
        causes. Talk to a qualified healthcare provider before starting any
        supplement, herbal protocol, or significant lifestyle change. Nothing
        here is a substitute for diagnosis or treatment by a licensed
        professional.
      </p>

      <h2>Your rights</h2>
      <p>
        You can contact us through the link to{' '}
        <a href={SITE.author.link} target="_blank" rel="noopener nofollow">
          theoraclelover.com
        </a>{' '}
        for any privacy question or removal request.
      </p>

      <p style={{ color: 'var(--rr-muted)', fontSize: 14, marginTop: 32 }}>
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </article>
  );
}
