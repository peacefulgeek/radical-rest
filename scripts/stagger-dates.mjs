#!/usr/bin/env node
// Compute a deterministic publish_at ISO datetime for each of the 500 topic indices.
// Indices 0..29 are the launch articles (already past-dated, keep their stored date).
// Indices 30..499 are pre-seeded queued articles, staggered into the future.
//
// Cadence: 1 NEW article per UTC weekday slot at 14:00 UTC.
// Starting tomorrow, skipping Sat/Sun, until we've assigned 470 dates.
// This produces a ~94-week (~22 month) drip schedule.

export function publishedAtFor(topicIndex, opts = {}) {
  const launchCount = 30;
  if (topicIndex < launchCount) return null; // existing past-dated, leave as-is
  const nthFuture = topicIndex - launchCount; // 0-based among the 470
  const start = opts.startDate ? new Date(opts.startDate) : (() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 1);
    d.setUTCHours(14, 0, 0, 0);
    return d;
  })();
  // Walk forward `nthFuture` weekdays from start.
  let d = new Date(start);
  let weekdaysSeen = 0;
  while (true) {
    const dow = d.getUTCDay(); // 0=Sun, 6=Sat
    const isWeekday = dow !== 0 && dow !== 6;
    if (isWeekday) {
      if (weekdaysSeen === nthFuture) break;
      weekdaysSeen++;
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d.toISOString();
}

// CLI for manual inspection.
if (import.meta.url === `file://${process.argv[1]}`) {
  for (const i of [29, 30, 31, 100, 250, 499]) {
    console.log(`idx=${i}  publishedAt=${publishedAtFor(i)}`);
  }
}
