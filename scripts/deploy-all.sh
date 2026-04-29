#!/usr/bin/env bash
# Orchestrator: deploy every TrendSeismograph surface in dependency order.
#
#   1. NLP service       -> Railway   (scripts/deploy-nlp.sh)
#   2. Backend API       -> Railway   (scripts/deploy-backend.sh)
#   3. Frontend          -> Vercel    (scripts/deploy-frontend.sh)
#   4. Zerve cells       -> Zerve     (scripts/deploy-zerve.sh)
#
# Order matters: backend reads NLP_SERVICE_URL, frontend reads
# NEXT_PUBLIC_API_URL, so each stage assumes the previous one is live.
#
# Skip individual stages with the matching env var:
#   SKIP_NLP=1 SKIP_BACKEND=1 SKIP_FRONTEND=1 SKIP_ZERVE=1
#
# Or filter via positional args (any subset, order ignored):
#   ./scripts/deploy-all.sh nlp backend frontend zerve
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

SKIP_NLP="${SKIP_NLP:-0}"
SKIP_BACKEND="${SKIP_BACKEND:-0}"
SKIP_FRONTEND="${SKIP_FRONTEND:-0}"
SKIP_ZERVE="${SKIP_ZERVE:-0}"

if [ "$#" -gt 0 ]; then
  SKIP_NLP=1; SKIP_BACKEND=1; SKIP_FRONTEND=1; SKIP_ZERVE=1
  for arg in "$@"; do
    case "${arg}" in
      nlp)      SKIP_NLP=0 ;;
      backend)  SKIP_BACKEND=0 ;;
      frontend) SKIP_FRONTEND=0 ;;
      zerve)    SKIP_ZERVE=0 ;;
      *) echo "Unknown stage: ${arg} (expected: nlp|backend|frontend|zerve)"; exit 2 ;;
    esac
  done
fi

banner() {
  echo ""
  echo "########################################################################"
  echo "## $1"
  echo "########################################################################"
}

run_stage() {
  local name="$1"; shift
  local script="$1"; shift
  local skip_var="$1"; shift
  if [ "${!skip_var}" = "1" ]; then
    echo "-- skipping ${name} (${skip_var}=1)"
    return 0
  fi
  banner "${name}"
  "${script}"
}

run_stage "1/4 NLP service (Railway)"   "${ROOT_DIR}/scripts/deploy-nlp.sh"      SKIP_NLP
run_stage "2/4 Backend API (Railway)"   "${ROOT_DIR}/scripts/deploy-backend.sh"  SKIP_BACKEND
run_stage "3/4 Frontend (Vercel)"       "${ROOT_DIR}/scripts/deploy-frontend.sh" SKIP_FRONTEND
run_stage "4/4 Zerve cells (GitHub sync + canvas)" "${ROOT_DIR}/scripts/deploy-zerve.sh" SKIP_ZERVE

banner "All requested stages complete"
echo "Next: run the post-deploy verification checks listed in docs/DEPLOYMENT.md."
