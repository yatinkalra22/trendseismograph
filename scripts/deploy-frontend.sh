#!/usr/bin/env bash
set -euo pipefail

echo "=== Deploying TrendSeismograph Frontend to Vercel ==="

command -v vercel >/dev/null 2>&1 || { echo "Installing Vercel CLI..."; npm install -g vercel; }

cd apps/frontend

# Deploy to production
echo "Deploying to Vercel..."
vercel --prod

echo ""
echo "=== Frontend deployed ==="
