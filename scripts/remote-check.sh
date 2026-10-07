#!/usr/bin/env bash
set -euo pipefail
mode=${1:-test}
case "$mode" in test|all) ;; *) echo 'Use test or all' >&2; exit 2;; esac
repo=$(git rev-parse --show-toplevel)
revision=$(git rev-parse HEAD)
run_id="ridgemesh-$(date -u +%Y%m%dT%H%M%SZ)-$$"
remote_dir="/home/jamie/ridgemesh-runs/$run_id"
ssh z370 "timeout 10 mkdir -p '$remote_dir'"
tar -C "$repo" --exclude=.git --exclude=node_modules --exclude=.vercel --exclude=.output --exclude=.nitro --exclude=.tanstack --exclude=.env --exclude='.env.*' --exclude=artifacts -czf - . | ssh z370 "timeout 60 tar -xzf - -C '$remote_dir'"
ssh z370 "timeout 600 bash -s -- '$remote_dir' '$run_id' '$revision' '$mode'" <<'REMOTE'
set -euo pipefail
cd "$1"
export RIDGEMESH_RUN_ID="$2" RIDGEMESH_REVISION="$3"
export PATH="/home/jamie/.local/node24/bin:$PATH"
printf 'RAN ON %s · run %s · revision %s · includes worktree snapshot\n' "$(hostname)" "$RIDGEMESH_RUN_ID" "$RIDGEMESH_REVISION"
node --version
npm --version
npm ci --no-audit --no-fund
npm test
if [ "$4" = all ]; then npm run typecheck; npm run lint; npm run build; fi
REMOTE
