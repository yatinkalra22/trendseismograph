#!/usr/bin/env bash
# One-shot bootstrap for the backend service on Railway.
#
# Reads .env from the repo root and:
#   1. verifies CLI login + project link
#   2. ensures the project has Postgres and Redis plugins
#   3. sets every env var the backend needs, using Railway template references
#      (${{Postgres.DATABASE_URL}}, ${{Redis.REDIS_URL}}) so credentials rotate
#      automatically and we never paste raw URLs.
#
# Run this once after `railway link`. After it succeeds, the regular
# `./scripts/deploy-backend.sh` is the redeploy loop.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

ENV_FILE="${ENV_FILE:-${ROOT_DIR}/.env}"
SERVICE_NAME="${SERVICE_NAME:-trendseismograph}"

echo "=== Railway backend bootstrap ==="

command -v railway >/dev/null 2>&1 || { echo "railway CLI not found. npm install -g @railway/cli"; exit 1; }
railway whoami >/dev/null 2>&1 || { echo "Not logged in. Run: railway login"; exit 1; }
railway status >/dev/null 2>&1 || { echo "Project not linked. Run: railway link"; exit 1; }

if [ ! -f "${ENV_FILE}" ]; then
  echo "No .env at ${ENV_FILE}. Run ./scripts/setup.sh first."
  exit 1
fi

# Pull a value out of .env without exporting the whole file
get_env() {
  grep -E "^$1=" "${ENV_FILE}" | head -n1 | cut -d= -f2- | tr -d '\r'
}

# Generate a strong secret if .env still has the placeholder
gen_secret() {
  local current="$1"
  if [[ -z "${current}" || "${current}" == *"change"* || "${current}" == *"your_"* || "${current}" == *"dev-secret"* ]]; then
    openssl rand -hex 32
  else
    echo "${current}"
  fi
}

API_KEY_SECRET="$(gen_secret "$(get_env API_KEY_SECRET)")"
NLP_SERVICE_SECRET="$(gen_secret "$(get_env NLP_SERVICE_SECRET)")"
YOUTUBE_API_KEY="$(get_env YOUTUBE_API_KEY)"
RESEND_API_KEY="$(get_env RESEND_API_KEY)"
ALERT_FROM_EMAIL="$(get_env ALERT_FROM_EMAIL)"
FRONTEND_URL="${FRONTEND_URL_OVERRIDE:-$(get_env FRONTEND_URL)}"

# 1. Ensure Postgres and Redis plugins exist on the project --------------------
ensure_plugin() {
  local name="$1"
  if railway variables --service "${name}" >/dev/null 2>&1; then
    echo "  ✔ ${name} plugin already exists"
  else
    echo "  + adding ${name} plugin..."
    railway add --database "${name}" || {
      echo "Could not add ${name} plugin automatically. Add it from the dashboard:"
      echo "    https://railway.app/project (your project) → New → Database → ${name}"
      exit 1
    }
  fi
}

echo ""
echo "[1/2] Ensuring database plugins..."
ensure_plugin "postgres"
ensure_plugin "redis"

# 2. Set backend service env vars ---------------------------------------------
echo ""
echo "[2/2] Setting env vars on service '${SERVICE_NAME}'..."

# Note: single-quote the ${{...}} references — those are Railway template
# strings, not shell expansions. Railway resolves them at runtime so the
# backend always sees the current Postgres/Redis credentials.
railway variables --service "${SERVICE_NAME}" \
  --set "NODE_ENV=production" \
  --set "API_KEY_SECRET=${API_KEY_SECRET}" \
  --set "NLP_SERVICE_SECRET=${NLP_SERVICE_SECRET}" \
  --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}' \
  --set 'REDIS_URL=${{Redis.REDIS_URL}}' \
  --set "NLP_SERVICE_URL=http://nlp.railway.internal:8000" \
  ${YOUTUBE_API_KEY:+--set "YOUTUBE_API_KEY=${YOUTUBE_API_KEY}"} \
  ${RESEND_API_KEY:+--set "RESEND_API_KEY=${RESEND_API_KEY}"} \
  ${ALERT_FROM_EMAIL:+--set "ALERT_FROM_EMAIL=${ALERT_FROM_EMAIL}"} \
  ${FRONTEND_URL:+--set "FRONTEND_URL=${FRONTEND_URL}"}

echo ""
echo "=== Bootstrap complete ==="
echo ""
echo "  API_KEY_SECRET     = ${API_KEY_SECRET}"
echo "  NLP_SERVICE_SECRET = ${NLP_SERVICE_SECRET}    <-- set the SAME value on the NLP service"
echo ""
echo "Next:"
echo "  1. Persist the secrets above into your local .env so they don't drift."
echo "  2. Run: railway variables --service ${SERVICE_NAME}"
echo "     and confirm the list above is present."
echo "  3. Deploy: ./scripts/deploy-backend.sh"
