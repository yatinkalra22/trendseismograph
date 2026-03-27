#!/usr/bin/env bash
set -euo pipefail

echo "=== Seeding TrendSeismograph Database ==="

# Check if backend container is running
if ! docker-compose ps backend | grep -q "Up"; then
  echo "Backend container is not running. Start it with: docker-compose up --build"
  exit 1
fi

docker-compose exec backend pnpm seed

echo "=== Seed complete ==="
