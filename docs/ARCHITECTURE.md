# Architecture

See the main [README](../README.md) for a high-level overview.

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
- PostgreSQL: structured trend data, time-series scores, back-test results (password required)
- Redis: caching (TTL-based) + Bull job queue management (password required)

## Configuration Architecture
- Centralized config bootstrap through `ConfigModule` with global cache enabled
- Startup-time environment validation (`src/config/env.validation.ts`) for required variables
- Async infrastructure wiring via `ConfigService` for TypeORM, Redis, and Bull
- Runtime configuration access via typed config objects (instead of direct `process.env` reads)
- Fail-fast startup behavior when critical environment variables are missing

Typed config modules:
- `app` -> runtime environment, port, frontend origin
- `security` -> API key and service auth secrets
- `ingestion` -> NLP service URL + adapter timeouts
- `alerts` -> email sender + frontend link origin

## Error Architecture
- Shared application-level error taxonomy in `common/errors/app-error.ts`
- Domain errors and infrastructure errors are separated at the type level
- Global HTTP filter maps taxonomy codes to stable HTTP statuses and response shape
- Error responses include `code`, `category`, `path`, and `method` for observability

## Module Boundaries
- Ingestion module:
  - Application layer: `application/ingestion-application.service.ts`
  - Adapter layer: `adapters/nlp-client.adapter.ts`
- Scoring module:
  - Application layer: `application/scoring-application.service.ts`
  - Domain scoring logic: `scoring.service.ts`
- Queue processors now orchestrate through application services, not direct external adapters

## Key Tables
- `trends` - tracked trends with metadata
- `trend_scores` - daily score snapshots (time-series)
- `reddit_samples` - raw posts with NLP labels
- `backtest_results` - historical validation
- `alerts` - user email alert subscriptions

## Bull Queue Pipeline
1. `trend-ingestion` (every 6h) -> fetch data from all sources
2. `nlp-scoring` -> classify + compute TPS
3. `alerts-check` -> trigger email alerts

Queue scheduler:
- Repeatable Bull job registered at app startup for `ingest-all` every 6 hours

## Security Model
- **Request logging** via global `LoggingInterceptor` (method, path, status, latency)
- **Helmet** sets security headers (X-Content-Type-Options, Strict-Transport-Security, X-Frame-Options, etc.)
- **API Key auth** (`Authorization: Bearer <key>`) protects all write/delete endpoints (trends, scores, alerts)
- **Rate limiting** via `@nestjs/throttler`: 100 req/min global, 10 req/min on alert creation
- **Input validation** via `class-validator` DTOs with whitelisting
- **Ownership checks** on alert deletion (email must match)
- **Service-to-service auth** via `X-Service-Key` header between backend and NLP service
- **NLP service** not exposed to host network (Docker internal only)
- **CORS** restricted to `FRONTEND_URL`
- **Environment hardening** via validated required env vars before app boot

## TPS Formula
```
TPS = (google_velocity * 0.30 + reddit_composite * 0.25 + stage_momentum * 0.25 + cross_platform * 0.20) * 10
```
