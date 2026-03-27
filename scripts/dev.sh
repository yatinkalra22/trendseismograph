#!/usr/bin/env bash
set -euo pipefail

echo "=== Starting TrendSeismograph Dev Environment ==="

# Start infra (postgres + redis) in background
echo "Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for healthy
echo "Waiting for services..."
until docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
until docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; do sleep 1; done
echo "Infrastructure ready."

echo ""
echo "Run in separate terminals:"
echo "  pnpm dev:backend    # NestJS on :3001"
echo "  pnpm dev:frontend   # Next.js on :3000"
echo "  cd services/nlp && uvicorn main:app --reload --port 8000  # NLP on :8000"
