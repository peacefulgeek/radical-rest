#!/usr/bin/env bash
# scripts/launch-loop.sh
# Shell driver. Calls generate-one.mjs once per topic. Each call is a fresh
# Node process that finishes in ~60s (well under any reaper threshold).
# Retries failed indices up to 3 times. Logs to /tmp/launch-loop.log.

set -u
cd "$(dirname "$0")/.."

LOG=/tmp/launch-loop.log
: > "$LOG"

# Build a 30-day staggered schedule, oldest first.
# Slot i corresponds to topic index i; we want article 0 to be MOST recent.
# Schedule cursor walks back from yesterday at 14:05 UTC, skipping every 7th day.
declare -a DATES
NOW_TS=$(date -u +%s)
CURSOR=$((NOW_TS - 86400))
for i in $(seq 0 29); do
  HOUR_SLOT=$(( (i % 5) * 2 + 9 ))  # 9, 11, 13, 15, 17 rotating
  MIN_SLOT=$(( (i * 7) % 60 ))
  DATE_STR=$(date -u -d "@$CURSOR" +"%Y-%m-%dT$(printf %02d "$HOUR_SLOT"):$(printf %02d "$MIN_SLOT"):00Z")
  DATES[$i]="$DATE_STR"
  CURSOR=$((CURSOR - 86400))
done

# Pass 1: try every topic.
echo "[loop] pass 1, 30 topics" | tee -a "$LOG"
for i in $(seq 0 29); do
  echo "[loop] -> i=$i date=${DATES[$i]}" | tee -a "$LOG"
  node scripts/generate-one.mjs "$i" "${DATES[$i]}" >> "$LOG" 2>&1
  RC=$?
  echo "[loop]    rc=$RC" | tee -a "$LOG"
done

# Pass 2 + 3: retry anything still missing.
for pass in 2 3 4 5; do
  MISSING=$(node -e "
import('./src/lib/db.mjs').then(async (m) => {
  const { TOPICS, slugifyTopic } = await import('./src/data/topics.mjs');
  const missing = [];
  for (let i = 0; i < TOPICS.length; i++) {
    const slug = slugifyTopic(TOPICS[i]);
    if (!m.getArticleBySlug(slug)) missing.push(i);
  }
  console.log(missing.join(' '));
});
" 2>/dev/null)
  if [ -z "$MISSING" ]; then
    echo "[loop] all 30 present after pass $((pass-1))" | tee -a "$LOG"
    break
  fi
  echo "[loop] pass $pass, missing: $MISSING" | tee -a "$LOG"
  for i in $MISSING; do
    echo "[loop] -> retry i=$i" | tee -a "$LOG"
    node scripts/generate-one.mjs "$i" "${DATES[$i]}" >> "$LOG" 2>&1
    echo "[loop]    rc=$?" | tee -a "$LOG"
  done
done

# Final summary
COUNT=$(node -e "import('./src/lib/db.mjs').then(m => console.log(m.countPublishedArticles()))" 2>/dev/null)
echo "[loop] FINAL count=$COUNT/30" | tee -a "$LOG"
