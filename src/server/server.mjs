// src/server/server.mjs
// Production Express server. Mounted by scripts/start-with-cron.mjs.
//
// Order of middleware matters:
//   1. WWW -> apex 301 redirect (FIRST, before anything else)
//   2. Compression
//   3. Static assets (Vite client build) with long cache
//   4. Dynamic routes: sitemap.xml, rss.xml, robots.txt, OG image redirect
//   5. SSR catch-all using the Vite-compiled SSR bundle

import express from 'express';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  listPublishedArticles,
  getArticleBySlug,
  countPublishedArticles,
  listAllArticleSlugs,
  recentCronLog,
  recentGateLog,
} from '../lib/db.mjs';
import { SITE, canonicalUrl } from '../lib/site-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const CLIENT_DIR = path.join(ROOT, 'dist', 'client');
const SERVER_DIR = path.join(ROOT, 'dist', 'server');

export async function createServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);

  // ---------- 1. WWW -> apex 301, BEFORE anything else ----------
  app.use((req, res, next) => {
    const host = (req.headers.host || '').toLowerCase();
    if (host.startsWith('www.')) {
      const apex = host.slice(4);
      return res.redirect(301, `https://${apex}${req.originalUrl}`);
    }
    // Force HTTPS in production behind DigitalOcean load balancer.
    if (
      process.env.NODE_ENV === 'production' &&
      req.headers['x-forwarded-proto'] === 'http'
    ) {
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
    next();
  });

  // ---------- 2. Compression ----------
  app.use(compression());

  // ---------- 3. Static client assets ----------
  if (fs.existsSync(CLIENT_DIR)) {
    app.use(
      express.static(CLIENT_DIR, {
        index: false,
        maxAge: '7d',
        setHeaders(res, filePath) {
          if (/\.(js|css|woff2?|svg|webp|png|jpg|ico)$/.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
          }
        },
      })
    );
  }

  // ---------- 4. Dynamic system routes ----------
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${SITE.origin}/sitemap.xml`,
        '',
      ].join('\n')
    );
  });

  app.get('/sitemap.xml', (_req, res) => {
    const slugs = listAllArticleSlugs();
    const urls = [
      { loc: `${SITE.origin}/`, lastmod: new Date().toISOString(), changefreq: 'daily', priority: 1.0 },
      { loc: `${SITE.origin}/about`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.6 },
      { loc: `${SITE.origin}/${SITE.toolsPageSlug}`, lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.7 },
      { loc: `${SITE.origin}/assessments`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.7 },
      { loc: `${SITE.origin}/privacy`, lastmod: new Date().toISOString(), changefreq: 'yearly', priority: 0.3 },
      ...slugs.map((s) => ({
        loc: `${SITE.origin}/${s.slug}`,
        lastmod: s.updated_at || s.published_at,
        changefreq: 'weekly',
        priority: 0.8,
      })),
    ];
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map(
          (u) =>
            `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod>` +
            `<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
        )
        .join('\n') +
      `\n</urlset>\n`;
    res.type('application/xml').send(xml);
  });

  // /feed.xml is the canonical alias used by spec; /rss.xml kept for legacy.
  app.get(['/rss.xml', '/feed.xml'], (_req, res) => {
    const items = listPublishedArticles({ limit: 30 });
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<rss version="2.0"><channel>\n` +
      `<title>${escapeXml(SITE.name)}</title>\n` +
      `<link>${SITE.origin}</link>\n` +
      `<description>${escapeXml(SITE.description)}</description>\n` +
      items
        .map(
          (a) =>
            `<item><title>${escapeXml(a.title)}</title>` +
            `<link>${SITE.origin}/${a.slug}</link>` +
            `<guid isPermaLink="true">${SITE.origin}/${a.slug}</guid>` +
            `<pubDate>${new Date(a.published_at).toUTCString()}</pubDate>` +
            `<description>${escapeXml(a.tldr || '')}</description></item>`
        )
        .join('\n') +
      `\n</channel></rss>\n`;
    res.type('application/rss+xml').send(xml);
  });

  // Health/status endpoint exposes cron + gate logs (used for verification).
  app.get('/_status.json', (_req, res) => {
    res.json({
      site: SITE.name,
      published_count: countPublishedArticles(),
      cron_log: recentCronLog(20),
      gate_log: recentGateLog(20),
      now: new Date().toISOString(),
    });
  });

  // ---------- 5. SSR catch-all ----------
  let ssrRender = null;
  const ssrEntryPath = path.join(SERVER_DIR, 'entry-server.js');
  if (fs.existsSync(ssrEntryPath)) {
    const mod = await import(pathToFileURL(ssrEntryPath).href);
    ssrRender = mod.render;
  } else {
    console.warn('[server] SSR bundle not found at', ssrEntryPath, '— serving fallback HTML.');
  }

  const templatePath = path.join(CLIENT_DIR, 'index.html');
  const baseTemplate = fs.existsSync(templatePath)
    ? fs.readFileSync(templatePath, 'utf8')
    : `<!doctype html><html><head><title>${SITE.name}</title></head><body><div id="app"><!--ssr-outlet--></div></body></html>`;

  app.use(async (req, res, next) => {
    try {
      if (req.method !== 'GET') return next();
      const url = req.originalUrl.split('?')[0];

      // Build per-route data so the SSR has what it needs.
      const data = buildRouteData(url);
      if (data.notFound) {
        res.status(404);
      }

      if (!ssrRender) {
        return res
          .status(200)
          .type('html')
          .send(
            baseTemplate
              .replace('<!--head-tags-->', defaultHead(data))
              .replace('<!--ssr-outlet-->', '<p style="padding:2rem;font-family:Georgia,serif">Loading...</p>')
          );
      }

      const { html, head } = ssrRender(url, data);
      const out = baseTemplate
        .replace('<!--head-tags-->', head)
        .replace('<!--ssr-outlet-->', html);
      res.status(data.notFound ? 404 : 200).type('html').send(out);
    } catch (err) {
      console.error('[ssr] error', err);
      next(err);
    }
  });

  return app;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function defaultHead(data) {
  const title = data.title || SITE.name;
  const desc = data.description || SITE.description;
  return [
    `<title>${escapeXml(title)}</title>`,
    `<meta name="description" content="${escapeXml(desc)}" />`,
    `<link rel="canonical" href="${data.canonical || canonicalUrl('/')}" />`,
  ].join('\n');
}

function buildRouteData(url) {
  if (url === '/' || url === '') {
    const articles = listPublishedArticles({ limit: 200 });
    return {
      route: 'home',
      title: `${SITE.name} — ${SITE.tagline}`,
      description: SITE.description,
      canonical: canonicalUrl('/'),
      articles,
    };
  }
  if (url === '/about') {
    return {
      route: 'about',
      title: `About — ${SITE.name}`,
      description: `About The Oracle Lover and ${SITE.name}.`,
      canonical: canonicalUrl('/about'),
    };
  }
  if (url === `/${SITE.toolsPageSlug}`) {
    return {
      route: 'tools',
      title: `${SITE.toolsPageName} — ${SITE.name}`,
      description: `${SITE.toolsPageName}: vetted tools and books for burnout recovery and deep rest.`,
      canonical: canonicalUrl(`/${SITE.toolsPageSlug}`),
    };
  }
  if (url === '/privacy') {
    return {
      route: 'privacy',
      title: `Privacy Policy — ${SITE.name}`,
      description: 'Privacy policy and affiliate disclosures.',
      canonical: canonicalUrl('/privacy'),
    };
  }
  if (url === '/assessments') {
    return {
      route: 'assessments',
      title: `Self-Assessments — ${SITE.name}`,
      description: 'Four quick self-assessments for the depleted: burnout stage, rest type, nervous-system state, and recovery readiness.',
      canonical: canonicalUrl('/assessments'),
    };
  }
  // Article route: /:slug
  const slug = url.replace(/^\//, '').replace(/\/$/, '');
  if (slug && /^[a-z0-9-]+$/.test(slug)) {
    const article = getArticleBySlug(slug);
    if (article) {
      // Internal-link suggestions: 4 sibling articles for SSR rendering.
      const siblings = listPublishedArticles({ limit: 12 }).filter(a => a.slug !== slug).slice(0, 6);
      return {
        route: 'article',
        title: `${article.title} — ${SITE.name}`,
        description: article.meta_description || article.tldr,
        canonical: canonicalUrl(`/${article.slug}`),
        article,
        siblings,
      };
    }
  }
  return {
    route: 'notfound',
    notFound: true,
    title: `Not Found — ${SITE.name}`,
    description: 'Page not found.',
    canonical: canonicalUrl(url),
  };
}
