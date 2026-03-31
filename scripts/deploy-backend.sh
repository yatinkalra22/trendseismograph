#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "=== Deploying TrendSeismograph Backend to Railway ==="

command -v railway >/dev/null 2>&1 || { echo "Installing Railway CLI..."; npm install -g @railway/cli; }

# Check if logged in
railway whoami >/dev/null 2>&1 || { echo "Please login first: railway login"; exit 1; }

# Link project if not already linked
if [ ! -f .railway/config.json ]; then
  echo "Linking Railway project..."
  railway init
fi

cd apps/backend

# Deploy
echo "Deploying..."
railway up --detach --ci

echo ""
echo "=== Backend deployed ==="
echo "Check status: railway status"
echo "View logs: railway logs"
