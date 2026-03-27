# Deployment Guide

All deployment is automated via scripts in `scripts/`.

## Local Development
```bash
./scripts/setup.sh          # Install deps + copy .env
docker-compose up --build   # Start all services
./scripts/seed.sh           # Seed 50+ trends
```

## Production Deployment

### Backend (Railway)
```bash
./scripts/deploy-backend.sh
```
Deploys NestJS + PostgreSQL + Redis to Railway.

### Frontend (Vercel)
```bash
./scripts/deploy-frontend.sh
```
Deploys Next.js to Vercel.

### NLP Service (Railway)
Deployed as a separate Railway service via docker-compose or `./scripts/deploy-nlp.sh`.

## Database Migrations

Schema is initialized by `init.sql` on first run. For subsequent schema changes, use TypeORM migrations:

```bash
# Generate a migration from entity changes
pnpm --filter backend migration:generate src/database/migrations/MyMigration

# Migrations run automatically on app startup (migrationsRun: true)
# Or run manually:
pnpm --filter backend migration:run
```

**Important:** `synchronize` is disabled in all environments. Never enable it — use migrations instead.

## Environment Variables
See `.env.example` for all required variables. Never hardcode secrets.

## URLs (after deployment)
- Frontend: https://trendseismograph.vercel.app
- Backend API: https://trendseismograph-backend.up.railway.app
- Swagger: disabled in production (available at `/api/docs` in development only)
- NLP Service: internal only (not public)
