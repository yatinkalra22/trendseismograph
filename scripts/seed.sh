#!/usr/bin/env bash
set -euo pipefail

if command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
else
  echo "Docker Compose is required (docker compose or docker-compose)."
  exit 1
fi

echo "=== Seeding TrendSeismograph Database ==="

# Check if backend container is running
if ! ${DOCKER_COMPOSE} ps backend | grep -q "Up"; then
  echo "Backend container is not running. Start it with: docker compose up --build"
  exit 1
fi

${DOCKER_COMPOSE} exec backend pnpm seed

echo "=== Seed complete ==="
