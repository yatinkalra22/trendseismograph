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

if [ -f .env ]; then
  # Load .env variables, ignoring comments
  export $(grep -v '^#' .env | xargs)
fi

: "${REDIS_PASSWORD:?REDIS_PASSWORD must be set (run ./scripts/setup.sh to create .env)}"

echo "=== Starting TrendSeismograph Dev Environment ==="

# Start infra (postgres + redis) in background
echo "Starting PostgreSQL and Redis..."
${DOCKER_COMPOSE} up -d postgres redis

# Wait for healthy
echo "Waiting for services..."
until ${DOCKER_COMPOSE} exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
until ${DOCKER_COMPOSE} exec -T redis redis-cli -a "${REDIS_PASSWORD}" ping >/dev/null 2>&1; do sleep 1; done
echo "Infrastructure ready."

echo ""
echo "Run in separate terminals:"
echo "  pnpm dev:backend    # NestJS on :3001"
echo "  pnpm dev:frontend   # Next.js on :3000"
echo "  cd services/nlp && uvicorn main:app --reload --port 8000  # NLP on :8000"
