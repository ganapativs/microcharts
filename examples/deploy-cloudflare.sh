#!/usr/bin/env bash
# Deploy the microcharts example apps to Cloudflare Pages — one project (one URL) per app.
#
# Prereqs (one time):
#   - A Cloudflare account.
#   - Auth ONE of these ways:
#       a) interactive:  npx wrangler login
#       b) CI/token:     export CLOUDFLARE_API_TOKEN=...   (needs "Cloudflare Pages: Edit")
#                        export CLOUDFLARE_ACCOUNT_ID=...
#
# Usage:
#   ./deploy-cloudflare.sh              # build + deploy all 7
#   ./deploy-cloudflare.sh cortex-ai    # build + deploy just one
#   MC_PAGES_PREFIX=acme ./deploy-cloudflare.sh   # override the project-name prefix
#
# Each app becomes a Pages project "<prefix>-<short>" → https://<prefix>-<short>.pages.dev
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PREFIX="${MC_PAGES_PREFIX:-microcharts}"
BRANCH="${CF_PAGES_BRANCH:-production}"
WRANGLER="npx --yes wrangler@4"

ALL="pulse-analytics ledger-finance vitals-health shipyard-devops dispatch-editorial atlas-realestate cortex-ai"

short_name() { case "$1" in
  pulse-analytics) echo pulse ;;   ledger-finance) echo ledger ;;
  vitals-health) echo vitals ;;    shipyard-devops) echo shipyard ;;
  dispatch-editorial) echo dispatch ;; atlas-realestate) echo atlas ;;
  cortex-ai) echo cortex ;;        *) echo "$1" ;;
esac; }

# Next.js (pulse) exports to out/; the Vite apps build to dist/.
out_dir() { case "$1" in pulse-analytics) echo out ;; *) echo dist ;; esac; }

TARGETS="${*:-$ALL}"

for app in $TARGETS; do
  dir="$ROOT/$app"
  [ -d "$dir" ] || { echo "!! no such app: $app"; exit 1; }
  proj="$PREFIX-$(short_name "$app")"
  outd="$(out_dir "$app")"

  echo ""
  echo "==================================================================="
  echo ">> $app  →  project '$proj'  (https://$proj.pages.dev)"
  echo "==================================================================="

  echo "-- installing deps (if needed) & building"
  ( cd "$dir" && [ -d node_modules ] || npm install --no-audit --no-fund )
  ( cd "$dir" && rm -rf "$outd" .next && npm run build )

  [ -d "$dir/$outd" ] || { echo "!! build produced no $outd/ for $app"; exit 1; }

  echo "-- ensuring Pages project exists"
  ( cd "$dir" && $WRANGLER pages project create "$proj" \
      --production-branch "$BRANCH" 2>/dev/null ) || true

  echo "-- deploying $outd/ to Cloudflare Pages"
  ( cd "$dir" && $WRANGLER pages deploy "$outd" \
      --project-name "$proj" --branch "$BRANCH" --commit-dirty=true )
done

echo ""
echo "Done. URLs:"
for app in $TARGETS; do
  echo "  https://$PREFIX-$(short_name "$app").pages.dev   ($app)"
done
