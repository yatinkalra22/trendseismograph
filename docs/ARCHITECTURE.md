# Architecture

See the main [README](../README.md) for a high-level overview.
For setup, deployment, and environment configuration, use [DEPLOYMENT.md](./DEPLOYMENT.md).

> **ZerveHack 2026 note.** This document describes the original NestJS + Next.js + FastAPI architecture, which is retained as reference. The hackathon submission re-implements the analytical core (ingestion, NLP, scoring, backtest) as a 13-block Zerve DAG under [`zerve/cells/`](../zerve/cells/). The TPS formula and weights below are unchanged; the Reddit term is sourced from YouTube + GDELT in the Zerve pipeline because Reddit API access was not granted.

## System Diagram
```
Client (Next.js 14 on Vercel)
  |
  | HTTPS REST
  v
API Gateway (NestJS on Railway) :3001
  |-- TrendsModule
  |-- ScoringModule
  |-- AlertsModule
  |-- AuthModule
  |
  |-- PostgreSQL (primary store)
  |-- Redis (cache + Bull queues)
  |
  v (HTTP internal, X-Service-Key auth)
Python NLP Service (FastAPI) :8000 (internal only, not host-exposed)
  |-- facebook/bart-large-mnli (discourse classification)
  |-- distilbert-sentiment (sentiment analysis)
  |-- pytrends (Google Trends)
  |-- PRAW (Reddit)
  |-- Wikipedia Pageview API
```

## Database: PostgreSQL + Redis
- PostgreSQL: structured trend data, time-series scores, and backtest results (password required).
- Redis: TTL-based caching and Bull queue orchestration (password required).

Cache keys used by scoring endpoints:

- `leaderboard:tps`
- `trends:tipping`
- `trends:rising`

## Configuration Architecture
- Centralized configuration bootstrap through `ConfigModule` with global cache enabled.
- Startup-time environment validation (`src/config/env.validation.ts`) for required variables.
- Async infrastructure wiring through `ConfigService` for TypeORM, Redis, and Bull.
- Runtime access through typed config objects (rather than direct `process.env` reads).
- Fail-fast startup behavior when critical environment variables are missing.

Typed configuration modules:
- `app` -> runtime environment, port, and frontend origin.
- `security` -> API key and service authentication secrets.
- `ingestion` -> NLP service URL and adapter timeouts.
- `alerts` -> email sender and frontend link origin.

## Error Architecture
- Shared application-level error taxonomy in `common/errors/app-error.ts`.
- Domain and infrastructure errors are separated at the type level.
- A global HTTP filter maps taxonomy codes to stable HTTP statuses and response shape.
- Error responses include `code`, `category`, `path`, and `method` for observability.

## Module Boundaries
- Ingestion module:
  - Application layer: `application/ingestion-application.service.ts`
  - Adapter layer: `adapters/nlp-client.adapter.ts`
- Scoring module:
  - Application layer: `application/scoring-application.service.ts`
  - Domain scoring logic: `scoring.service.ts`
- Queue processors orchestrate through application services, not direct external adapters.

Additional boundary highlights:

- Alerts module handles subscription lifecycle and asynchronous email delivery through the alerts queue.
- Health controller exposes service health and backend-to-NLP connectivity status.

## Key Tables
- `trends`: tracked trends with metadata.
- `trend_scores`: daily score snapshots (time-series).
- `reddit_samples`: raw posts with NLP labels.
- `backtest_results`: historical validation output.
- `alerts`: user email alert subscriptions.

## Bull Queue Pipeline
1. `trend-ingestion` (every 6h) -> fetch data from all sources
2. `nlp-scoring` -> classify + compute TPS
3. `alerts-check` -> trigger email alerts

Queue scheduler:
- A repeatable Bull job registers at startup for `ingest-all` every six hours.

Operational run commands and deployment flow are documented in [DEPLOYMENT.md](./DEPLOYMENT.md).

## Security Model
- **Request logging** via global `LoggingInterceptor` (method, path, status, latency)
- **Helmet** sets security headers (X-Content-Type-Options, Strict-Transport-Security, X-Frame-Options, etc.)
- **API key auth** (`Authorization: Bearer <key>`) protects write/delete endpoints (trends, scores, alerts)
- **Rate limiting** via `@nestjs/throttler`: 100 req/min global, 10 req/min on alert creation
- **Input validation** via `class-validator` DTOs with whitelisting
- **Ownership checks** on alert deletion (email must match)
- **Service-to-service auth** via `X-Service-Key` header between backend and NLP service
- **NLP service** is not exposed to the host network (Docker internal only)
- **CORS** restricted to `FRONTEND_URL`
- **Environment hardening** via validated required env vars before app boot

Detailed remediation history lives in [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).

## TPS Formula
```
TPS = (google_velocity * 0.30 + reddit_composite * 0.25 + stage_momentum * 0.25 + cross_platform * 0.20) * 10
```
