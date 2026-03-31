#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "=== Deploying TrendSeismograph NLP Service to Railway ==="

command -v railway >/dev/null 2>&1 || { echo "Installing Railway CLI..."; npm install -g @railway/cli; }
railway whoami >/dev/null 2>&1 || { echo "Please login first: railway login"; exit 1; }

cd services/nlp

echo "Deploying NLP service..."
railway up --detach --ci

echo ""
echo "=== NLP service deployed ==="
echo "Note: First deploy takes longer (HuggingFace model download ~1.6GB)"
