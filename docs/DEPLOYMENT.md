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

The project ships with two deployable surfaces:

| Surface | What it is | Target |
|---------|-----------|--------|
| Web application | NLP service + Backend API + Frontend | Railway + Railway + Vercel |
| Zerve project | The 13-cell pipeline in `zerve/cells/` (cell 12 → FastAPI, cell 13 → Streamlit App) | Zerve hosted runtime |

Deployment scripts install missing CLIs automatically and require prior authentication (`railway login`, `vercel login`, plus the Zerve GitHub v2 integration on the project).

### Deploy everything in one command

```bash
./scripts/deploy-all.sh
```

Runs NLP → Backend → Frontend → Zerve in order. Order matters: backend reads `NLP_SERVICE_URL`, frontend reads `NEXT_PUBLIC_API_URL`, so each stage assumes the previous one is live. Skip stages with `SKIP_NLP=1`, `SKIP_BACKEND=1`, `SKIP_FRONTEND=1`, `SKIP_ZERVE=1`, or by passing positional args (`./scripts/deploy-all.sh frontend zerve`).

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

### Zerve project (cells 12 + 13)

```bash
./scripts/deploy-zerve.sh
```

What the script does, fully unattended:

1. Runs the local smoke test (`scripts/run_zerve_local.py 01`) so cells fail locally before they fail on Zerve.
2. Verifies the working tree is clean and pushes the current branch to `origin`. Zerve pulls from `origin` via its GitHub v2 integration; this is the supported automation path.
3. Prints the canvas-side actions (one-time setup; subsequent deploys are pure script-driven hot reloads).

One-time canvas setup (only required the first time):

- On <https://app.zerve.ai>, create a TrendSeismograph project.
- **Settings → Integrations → GitHub v2**: connect this repository on `main`. Zerve imports `zerve/cells/*.py` into the canvas.
- **Environment → Requirements (Python)**: paste `zerve/requirements.txt` (or pin per cell from that file).
- **Environment → Secrets**: set `YOUTUBE_API_KEY` (used by cell 03). Reddit/Resend keys are dormant for the hackathon submission and only needed if you re-enable those code paths.
- Run all cells once (`Run All`). Cell 02 (~5–7 min, pytrends) and cells 06/07 (~700 MB HuggingFace download) are slow on first run only.
- Open **cell 12 (`score_api`) → Deploy → Create FastAPI endpoint** (handler `score`, method `GET`, route `/score`). The issued `*.zerve.app` URL is the API deliverable.
- Open **cell 13 (`app`) → Deploy → Create Streamlit App**. The issued `*.zerve.app` URL is the app deliverable.

After that, the redeploy loop is just `./scripts/deploy-zerve.sh`: a new commit is pushed, Zerve pulls it, affected cells re-run, and both the FastAPI and Streamlit deployments hot-reload from the new outputs.

> Why this is not a single `zerve deploy` command: Zerve does not currently expose a public CLI that uploads cells and triggers `Deploy → Create *` from outside the canvas. The GitHub v2 integration is the supported automation surface, and the script above wraps every step that lives outside the canvas.

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

Copy `.env.example` to `.env` and update values. For detailed instructions on how to obtain these keys, see [ENV_GUIDE.md](./ENV_GUIDE.md).

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
- Zerve FastAPI: `GET <zerve-api-url>/score?trend_slug=<known-slug>` returns the same shape as the legacy NestJS `/api/trends/:slug/score`.
- Zerve Streamlit: open the issued `*.zerve.app` URL and confirm the leaderboard and selected-trend card render.

For common failures and fixes, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
For release readiness checks, see [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md).
