// scripts/start-with-cron.mjs
// Production entry. Boots Express, then registers all in-code crons.
// AUTO_GEN_ENABLED=true (default) enables generation; the gate runs regardless.

import cron from 'node-cron';
import { createServer } from '../src/server/server.mjs';
import {
  dailyGenerationJob,
  refreshDailyJob,
  refreshWeeklyJob,
  reverifyAsinsJob,
  seedAsinsJob,
} from '../src/lib/cron-jobs.mjs';
import { logCron, recentCronLog } from '../src/lib/db.mjs';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function boot() {
  const app = await createServer();
  app.listen(PORT, () => {
    console.log(`[radical-rest] listening on :${PORT}`);
    logCron('boot', 'ok', `port=${PORT} node=${process.version}`);
  });

  // ---------- CRONS ----------
  // All crons in-code (node-cron). NO Manus scheduler. NO forge.manus.im.

  // 5 articles per weekday, one per slot to spread API load:
  //  09:05, 11:05, 13:05, 15:05, 17:05 UTC, Mon-Fri.
  for (const hour of [9, 11, 13, 15, 17]) {
    cron.schedule(
      `5 ${hour} * * 1-5`,
      async () => {
        try {
          const r = await dailyGenerationJob({ batchSize: 1 });
          console.log('[cron] daily-generation', r);
        } catch (err) {
          console.error('[cron] daily-generation error', err);
          logCron('daily-generation', 'crash', String(err.message).slice(0, 200));
        }
      },
      { timezone: 'UTC' }
    );
  }

  // Daily refresh: 03:00 UTC, 1 article per run (~30/30d).
  cron.schedule(
    '0 3 * * *',
    async () => {
      try {
        const r = await refreshDailyJob({ limit: 1, olderThanDays: 30 });
        console.log('[cron] refresh-daily', r.length);
      } catch (err) {
        console.error('[cron] refresh-daily error', err);
        logCron('refresh-daily', 'crash', String(err.message).slice(0, 200));
      }
    },
    { timezone: 'UTC' }
  );

  // Weekly deeper refresh: Sunday 04:00 UTC, 5 oldest articles.
  cron.schedule(
    '0 4 * * 0',
    async () => {
      try {
        const r = await refreshWeeklyJob({ limit: 5, olderThanDays: 90 });
        console.log('[cron] refresh-weekly', r.length);
      } catch (err) {
        console.error('[cron] refresh-weekly error', err);
        logCron('refresh-weekly', 'crash', String(err.message).slice(0, 200));
      }
    },
    { timezone: 'UTC' }
  );

  // Weekly ASIN re-verification: Monday 02:00 UTC.
  cron.schedule(
    '0 2 * * 1',
    async () => {
      try {
        const r = await reverifyAsinsJob();
        console.log('[cron] reverify-asins', r);
      } catch (err) {
        console.error('[cron] reverify-asins error', err);
        logCron('reverify-asins', 'crash', String(err.message).slice(0, 200));
      }
    },
    { timezone: 'UTC' }
  );

  // First-boot seed (runs once 60s after boot, then never via cron).
  setTimeout(async () => {
    try {
      const r = await seedAsinsJob();
      console.log('[boot] seedAsinsJob', r);
    } catch (err) {
      console.error('[boot] seedAsinsJob error', err);
    }
  }, 60_000);

  // First-boot generation top-up: if fewer than 30 articles, generate one
  // every 4 minutes until the floor is reached. This is a safety net only;
  // launch generation runs separately via scripts/generate-launch-articles.mjs.
  if (String(process.env.AUTO_GEN_ENABLED || 'true').toLowerCase() === 'true') {
    let topUpInterval = setInterval(async () => {
      try {
        const { countPublishedArticles } = await import('../src/lib/db.mjs');
        if (countPublishedArticles() >= 30) { clearInterval(topUpInterval); return; }
        await dailyGenerationJob({ batchSize: 1 });
      } catch (err) {
        console.error('[topup] error', err);
      }
    }, 4 * 60 * 1000);
  }

  console.log('[radical-rest] crons registered:');
  console.log('  daily-generation: 5 5,11,13,15,17 * * 1-5  (UTC) [×5 slots]');
  console.log('  refresh-daily:    0 3 * * *  (UTC)');
  console.log('  refresh-weekly:   0 4 * * 0  (UTC)');
  console.log('  reverify-asins:   0 2 * * 1  (UTC)');
  console.log('[radical-rest] recent cron log:', recentCronLog(5));
}

boot().catch((err) => {
  console.error('[radical-rest] fatal boot error', err);
  process.exit(1);
});
