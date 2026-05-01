#!/usr/bin/env bash
# scripts/batch.sh i1 i2 i3 ... — generate articles for these indices, one
# Node process per article. Logs to /tmp/batch-$$.log.
set -u
cd "$(dirname "$0")/.."

LOG=${BATCH_LOG:-/tmp/batch-$$.log}
: > "$LOG"
echo "[batch $$] indices: $*" | tee -a "$LOG"

# Build per-index publish dates, oldest first across the 30-day window.
date_for() {
  local i=$1
  local hour_slot=$(( (i % 5) * 2 + 9 ))
  local min_slot=$(( (i * 7) % 60 ))
  local sec_offset=$(( i * 86400 ))
  local ts=$(( $(date -u +%s) - 86400 - sec_offset ))
  date -u -d "@$ts" +"%Y-%m-%dT$(printf %02d "$hour_slot"):$(printf %02d "$min_slot"):00Z"
}

for i in "$@"; do
  D=$(date_for "$i")
  echo "[batch $$] -> i=$i date=$D" | tee -a "$LOG"
  node --experimental-sqlite scripts/generate-one.mjs "$i" "$D" >> "$LOG" 2>&1
  RC=$?
  echo "[batch $$]    rc=$RC" | tee -a "$LOG"
done

COUNT=$(node --experimental-sqlite -e "import('./src/lib/db.mjs').then(m => console.log(m.countPublishedArticles()))" 2>/dev/null)
echo "[batch $$] DONE count=$COUNT" | tee -a "$LOG"
