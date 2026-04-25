#!/usr/bin/env bash
# Seed the TrendSeismograph database. Supports two execution modes:
#   1. Docker mode  — used when `docker compose up` is running the full stack.
#                     Runs `pnpm seed` inside the backend container.
#   2. Native mode  — used when the developer runs `pnpm dev` on the host.
#                     Runs `pnpm seed` from the repo root with dotenv-cli so
#                     DATABASE_URL resolves to the local Postgres on the port
#                     configured in .env (typically 5433 with this repo).
#
# Mode is auto-detected: if a `backend` container is running we use Docker,
# otherwise we fall back to native. Force a mode with: SEED_MODE=docker|native
set -euo pipefail

MODE="${SEED_MODE:-auto}"

if command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
else
  DOCKER_COMPOSE=""
fi

backend_container_running() {
  [ -n "${DOCKER_COMPOSE}" ] || return 1
  ${DOCKER_COMPOSE} ps backend 2>/dev/null | grep -q "Up"
}

echo "=== Seeding TrendSeismograph Database ==="

if [ "${MODE}" = "auto" ]; then
  if backend_container_running; then
    MODE="docker"
  else
    MODE="native"
  fi
fi

case "${MODE}" in
  docker)
    if [ -z "${DOCKER_COMPOSE}" ] || ! backend_container_running; then
      echo "Backend container is not running. Start it with: docker compose up --build"
      echo "Or run in native mode (host pnpm dev): SEED_MODE=native ./scripts/seed.sh"
      exit 1
    fi
    echo "Mode: docker (executing inside the backend container)"
    ${DOCKER_COMPOSE} exec backend pnpm seed
    ;;
  native)
    if [ ! -f .env ]; then
      echo "Native mode requires a .env at the repo root. Run ./scripts/setup.sh first."
      exit 1
    fi
    echo "Mode: native (running on the host with .env loaded)"
    pnpm exec dotenv -e .env --override -- pnpm --filter @trendseismograph/backend run seed
    ;;
  *)
    echo "Unknown SEED_MODE: ${MODE} (expected: auto, docker, native)"
    exit 1
    ;;
esac

echo "=== Seed complete ==="
