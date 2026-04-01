# Deployment Guide

This is the canonical source for setup, deployment, and environment variable configuration.

## Prerequisites

Minimum requirements:

- Node.js >= 20
- pnpm >= 9
- Docker
- Docker Compose (`docker compose` or `docker-compose`)

Run this once:

```bash
./scripts/setup.sh
```

## Local Development

### Option A: Full stack in Docker

```bash
docker compose up --build
./scripts/seed.sh
```

Local service URLs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger (dev): http://localhost:3001/api/docs
- NLP docs: http://localhost:8000/docs

### Option B: Hybrid local development

Use Docker only for infrastructure, then run application services in watch mode:

```bash
./scripts/dev.sh
```

Then run the following in separate terminals:

```bash
pnpm dev:backend
pnpm dev:frontend
cd services/nlp && uvicorn main:app --reload --port 8000
```

Notes:

- The NLP service has a startup grace period and may take about 60 seconds to become healthy on first run.
- `./scripts/seed.sh` expects the backend container to be running.

## Production Deployment

Deployment scripts install missing CLIs automatically and require authentication.

### Backend (Railway)

```bash
./scripts/deploy-backend.sh
```

### Frontend (Vercel)

```bash
./scripts/deploy-frontend.sh
```

### NLP Service (Railway)

```bash
./scripts/deploy-nlp.sh
```

The NLP service should remain internal to backend traffic and should not be publicly exposed.

## Database Migrations

Initial schema is created by `apps/backend/src/database/init.sql` on first container boot.
After that, use TypeORM migrations:

```bash
# Generate from entity changes
pnpm --filter @trendseismograph/backend run migration:generate src/database/migrations/MyMigration

# Run manually (migrations also run on app startup)
pnpm --filter @trendseismograph/backend run migration:run
```

`synchronize` is disabled by design. Keep it disabled in every environment.

## Environment Variables

Copy `.env.example` to `.env` and update values.

```bash
cp .env.example .env
```

### Required for backend startup

- `DATABASE_URL`
- `REDIS_URL`
- `API_KEY_SECRET`

### Required for Docker local stack

- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`

### Required for full feature set

- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USER_AGENT`
- `RESEND_API_KEY` (required to send alerts)
- `ALERT_FROM_EMAIL` (sender identity)

### Common optional values with defaults

- `NODE_ENV` (default: `development`)
- `PORT` (default: `3001`)
- `FRONTEND_URL` (default: `http://localhost:3000`)
- `NLP_SERVICE_URL` (default: `http://localhost:8000`)
- `NLP_SERVICE_SECRET` (default fallback exists for local development)
- `NEXT_PUBLIC_API_URL` (frontend API base URL)
- `NLP_CLASSIFY_TIMEOUT_MS` (default: `30000`)
- `NLP_REDDIT_TIMEOUT_MS` (default: `15000`)
- `NLP_TRENDS_TIMEOUT_MS` (default: `20000`)
- `NLP_WIKIPEDIA_TIMEOUT_MS` (default: `10000`)
- `NLP_HEALTH_TIMEOUT_MS` (default: `5000`)
- `CLASSIFY_MAX_CONCURRENCY` (default: `4`)

## Frontend API URL Warning

`apps/frontend/Dockerfile` sets `NEXT_PUBLIC_API_URL=http://localhost:3001` at build time. This is valid for local Docker usage, but not for internet-facing production routing. For production, set `NEXT_PUBLIC_API_URL` explicitly in your frontend deployment environment to your public backend URL.

## Post-Deploy Verification

- Backend health: `GET /health`
- Backend-to-NLP connectivity: `GET /health/nlp`
- Swagger: available only when `NODE_ENV` is not `production`

For common failures and fixes, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
For release readiness checks, see [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md).
