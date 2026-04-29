#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "=== Deploying TrendSeismograph Backend to Railway ==="

command -v railway >/dev/null 2>&1 || { echo "Installing Railway CLI..."; npm install -g @railway/cli; }

# Check if logged in
railway whoami >/dev/null 2>&1 || { echo "Please login first: railway login"; exit 1; }

# Railway CLI 4.x stores link state outside the repo, so probe with `railway status`.
if ! railway status >/dev/null 2>&1; then
  echo "Project not linked. Run 'railway link' to attach this repo to an existing project,"
  echo "or 'railway init' to create a new one. Aborting to avoid creating a duplicate."
  exit 1
fi

# Deploy from repo root: the backend Dockerfile uses pnpm workspace commands
# that need pnpm-lock.yaml + pnpm-workspace.yaml + the root package.json,
# all of which live at the repo root. railway.json points the builder at
# apps/backend/Dockerfile while keeping the build context here.
SERVICE="${RAILWAY_SERVICE:-trendseismograph}"
echo "Deploying service '${SERVICE}' from repo root..."
railway up --detach --ci --service "${SERVICE}"

echo ""
echo "=== Backend deployed ==="
echo "Check status: railway status"
echo "View logs: railway logs"
