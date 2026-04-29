#!/usr/bin/env bash
# Deploy zerve/cells/* to the Zerve hosted runtime.
#
# Zerve does not expose a public CLI for uploading and publishing cells, so
# the supported automation path is the GitHub v2 integration: Zerve pulls
# the connected repository into the canvas and the Deploy panel publishes
# cell 12 (FastAPI) and cell 13 (Streamlit). This script automates every
# step that lives outside the canvas:
#
#   1. local smoke test of the Python cells
#   2. ensure the working tree is clean and the current commit is pushed
#      to origin so Zerve has the version we want to deploy
#   3. print the canvas-side actions that must be clicked once
#
# After the canvas is wired up once, re-running this script is the entire
# redeploy loop: cells re-run on Zerve and the FastAPI/Streamlit deployments
# hot-reload from the new outputs.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

SKIP_SMOKE="${SKIP_SMOKE:-0}"
SKIP_PUSH="${SKIP_PUSH:-0}"
ZERVE_PROJECT_URL="${ZERVE_PROJECT_URL:-}"

echo "=== Deploying TrendSeismograph Zerve project ==="

# 1. Local smoke test --------------------------------------------------------
if [ "${SKIP_SMOKE}" = "1" ]; then
  echo "[1/3] Smoke test skipped (SKIP_SMOKE=1)"
else
  echo "[1/3] Running local smoke test (cell 01)..."
  command -v python3 >/dev/null 2>&1 || { echo "python3 is required"; exit 1; }
  python3 scripts/run_zerve_local.py 01
fi

# 2. Sync the commit Zerve will pull -----------------------------------------
echo ""
echo "[2/3] Syncing repository to origin (Zerve pulls via GitHub v2 integration)..."

command -v git >/dev/null 2>&1 || { echo "git is required"; exit 1; }

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not inside a git repository — aborting."
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "No 'origin' remote configured. Add one with:"
  echo "  git remote add origin git@github.com:<owner>/<repo>.git"
  exit 1
fi

REMOTE_URL="$(git remote get-url origin)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
SHA="$(git rev-parse --short HEAD)"

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is dirty. Commit or stash changes before deploying so the"
  echo "version on Zerve matches what is on disk:"
  git status --short
  exit 1
fi

if [ "${SKIP_PUSH}" = "1" ]; then
  echo "Push skipped (SKIP_PUSH=1)"
else
  echo "Pushing ${BRANCH} (${SHA}) to ${REMOTE_URL}..."
  git push origin "${BRANCH}"
fi

# 3. Canvas-side instructions ------------------------------------------------
echo ""
echo "[3/3] Canvas actions (one-time setup, then re-deploy is automatic)"
cat <<'EOF'

  First-time setup on https://app.zerve.ai (or your self-hosted Zerve):

    a. Create or open the TrendSeismograph project.
    b. Settings > Integrations > GitHub v2 > connect this repository
       on branch 'main'. Zerve will pull zerve/cells/*.py into the canvas.
    c. Environment > Requirements > Python: paste the contents of
       zerve/requirements.txt (or pin them per-cell from that file).
    d. Environment > Secrets:
         YOUTUBE_API_KEY   (used by cell 03)
       Other API keys are optional and only needed if you enable the
       legacy Reddit/Resend code paths.
    e. Run cells 01..11 once end-to-end (Run All). Cell 02 takes ~5-7 min
       on first run because pytrends is slow; cells 06/07 download ~700 MB
       of HuggingFace weights on first run only.

  Publish the two deliverables:

    f. Open cell 12 (score_api) > Deploy > Create FastAPI endpoint.
       Handler: score   Method: GET   Route: /score
       Copy the issued *.zerve.app URL — that is the API deliverable.

    g. Open cell 13 (app) > Deploy > Create Streamlit App.
       Copy the issued *.zerve.app URL — that is the App deliverable.

  Re-deploy loop (after the canvas is wired up):

      ./scripts/deploy-zerve.sh

    pushes a new commit, Zerve pulls it via the GitHub v2 integration,
    re-runs the affected cells, and hot-reloads both deployments.

EOF

if [ -n "${ZERVE_PROJECT_URL}" ]; then
  echo "  Project URL: ${ZERVE_PROJECT_URL}"
fi

echo "=== Zerve deploy step complete (commit ${SHA} on ${BRANCH}) ==="
