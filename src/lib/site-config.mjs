// src/lib/site-config.mjs
// Single source of truth for site-wide values. URL + Bunny zone are filled in
// post-build per spec; code references SITE.* so they cascade everywhere.

export const SITE = {
  name: 'Radical Rest',
  tagline: 'You are not lazy. You are depleted.',
  description:
    'Burnout recovery, anti-hustle culture, deep rest, the nervous system of overwork, and the science of doing nothing.',
  // Apex domain (no www, no protocol prefix here — added in code).
  // Filled post-build. Until then, default keeps everything functional.
  apexDomain: process.env.SITE_APEX_DOMAIN || 'aradicalrest.com',
  get origin() {
    return `https://${this.apexDomain}`;
  },
  author: {
    name: 'The Oracle Lover',
    title: 'The Oracle Lover — Intuitive Educator & Oracle Guide',
    link: 'https://theoraclelover.com',
    bio:
      'The Oracle Lover writes about the body, the nervous system, and the practical mechanics ' +
      'of rest. No mysticism. No theory without a tool. Demystifying intuition for people who ' +
      'want it grounded.',
  },
  bunny: {
    // Filled post-build. Code uses SITE.bunny.cdnHost and joins paths.
    cdnHost:
      process.env.BUNNY_CDN_HOST || 'radical-rest.b-cdn.net',
    storageZone: process.env.BUNNY_STORAGE_ZONE || 'radical-rest',
    apiHost: process.env.BUNNY_API_HOST || 'ny.storage.bunnycdn.com',
    accessKey: process.env.BUNNY_ACCESS_KEY || '',
  },
  amazon: {
    tag: 'spankyspinola-20',
    disclosure: 'As an Amazon Associate, I earn from qualifying purchases.',
  },
  colors: {
    bg: '#F2EFEA',
    text: '#3A3632',
    accent: '#7A9EB1',
    accentAlt: '#9B8EB4',
  },
  toolsPageName: 'The Rest Toolkit',
  toolsPageSlug: 'the-rest-toolkit',
  bottomSectionLabel: 'Rest Library',
};

export function bunnyImage(pathOnZone) {
  const clean = String(pathOnZone || '').replace(/^\/+/, '');
  return `https://${SITE.bunny.cdnHost}/${clean}`;
}

export function canonicalUrl(pathname) {
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${SITE.origin}${p}`;
}
