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

## TPS Formula
```
TPS = (google_velocity * 0.30 + reddit_composite * 0.25 + stage_momentum * 0.25 + cross_platform * 0.20) * 10
```
