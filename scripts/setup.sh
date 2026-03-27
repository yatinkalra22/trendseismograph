#!/usr/bin/env bash
set -euo pipefail

echo "=== TrendSeismograph Setup ==="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "Installing pnpm..."; npm install -g pnpm; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required. Install from https://docker.com"; exit 1; }

# Create .env from example if it doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit it with your credentials"
else
  echo ".env already exists, skipping"
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
pnpm install

echo ""
echo "=== Setup complete ==="
echo "Next steps:"
echo "  1. Edit .env with your Reddit API + Resend credentials"
echo "  2. Run: docker-compose up --build"
echo "  3. Run: ./scripts/seed.sh"
echo "  4. Open http://localhost:3000"
