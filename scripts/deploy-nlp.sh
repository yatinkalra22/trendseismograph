#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "=== Deploying TrendSeismograph NLP Service to Railway ==="

command -v railway >/dev/null 2>&1 || { echo "Installing Railway CLI..."; npm install -g @railway/cli; }
railway whoami >/dev/null 2>&1 || { echo "Please login first: railway login"; exit 1; }

# Railway CLI 4.x stores link state outside the repo, so probe with `railway status`.
if ! railway status >/dev/null 2>&1; then
  echo "Project not linked. Run 'railway link' to attach this repo to an existing project,"
  echo "or 'railway init' to create a new one. Aborting to avoid creating a duplicate."
  exit 1
fi

cd services/nlp

echo "Deploying NLP service..."
railway up --detach --ci

echo ""
echo "=== NLP service deployed ==="
echo "Note: First deploy takes longer (HuggingFace model download ~1.6GB)"
