import React from 'react';
import { SITE, bunnyImage } from '../../lib/site-config.mjs';

export default function About() {
  return (
    <article className="rr-article">
      <h1>About {SITE.name}</h1>
      <p className="rr-byline">
        Written by{' '}
        <a href={SITE.author.link} target="_blank" rel="noopener nofollow">
          {SITE.author.name}
        </a>
      </p>

      <img
        src={bunnyImage('about/oracle-lover-portrait.webp')}
        alt="The Oracle Lover"
        loading="lazy"
        width={520}
        height={520}
        style={{ width: '100%', maxWidth: 360, height: 'auto', borderRadius: 6, margin: '12px 0 24px' }}
      />

      <p>
        {SITE.name} exists for one reason. You are exhausted, and the standard
        advice has been useless. Take a bath. Try a meditation app. Push through.
        None of that touches what is actually wrong.
      </p>

      <p>
        I am the Oracle Lover. I read cards, and I have a science background.
        That combination matters here. Burnout is not a vibe. It is a measurable
        depletion of the nervous system, the adrenal axis, and the body's
        capacity to recover. The protocol to come back is concrete. So is the
        timeline.
      </p>

      <p>
        On this site you will find writing about deep rest, anti-hustle culture,
        adrenal recovery, restorative practices, and the science behind why
        doing nothing is the most productive thing you can do when you are this
        depleted. No mystical fluff. No corporate wellness lies. Just what
        works, and how long it takes.
      </p>

      <p>
        For more on intuitive practice, oracle reading, and the inner life that
        rest reveals, visit{' '}
        <a href={SITE.author.link} target="_blank" rel="noopener nofollow">
          theoraclelover.com
        </a>.
      </p>

      <h2>What you will find here</h2>
      <ul>
        <li>The seven types of rest, and which ones you actually need</li>
        <li>Burnout recovery timelines that are honest about how long it takes</li>
        <li>Adrenal repair protocols, sleep debt repayment, somatic reset practices</li>
        <li>The TCM and Ayurvedic frameworks for jing depletion and ojas rebuilding</li>
        <li>Reviews of the tools and books that genuinely help (in The Rest Toolkit)</li>
      </ul>

      <p>
        Read at your own pace. There is no rush. That is, in some ways, the
        whole point.
      </p>
    </article>
  );
}
