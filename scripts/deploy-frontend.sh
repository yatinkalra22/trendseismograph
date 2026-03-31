#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "=== Deploying TrendSeismograph Frontend to Vercel ==="

command -v vercel >/dev/null 2>&1 || { echo "Installing Vercel CLI..."; npm install -g vercel; }

cd apps/frontend

# Deploy to production
echo "Deploying to Vercel..."
vercel --prod --yes

echo ""
echo "=== Frontend deployed ==="
