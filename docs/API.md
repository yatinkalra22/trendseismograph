# API Reference

Base URL: `http://localhost:3001` in local development.

All routes below are served by the backend service. Health endpoints are intentionally outside the `/api` prefix.

## Trends
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/trends | No | List trends (paginated; supports `stage`, `category`, `page`, `limit`). |
| GET | /api/trends/:slug | No | Get one trend with latest score. |
| GET | /api/trends/:slug/history | No | Get trend time-series (90 days by default; supports `days`). |
| GET | /api/trends/:slug/reddit | No | Get Reddit discourse samples for a trend. |
| POST | /api/trends | API key | Add a new trend. |
| DELETE | /api/trends/:slug | API key | Stop tracking a trend. |

## Scoring
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/scores/leaderboard | No | Get top 20 trends by TPS. |
| GET | /api/scores/tipping | No | Get trends in the `tipping_point` stage. |
| GET | /api/scores/rising | No | Get fastest-rising trends by velocity. |
| POST | /api/scores/trigger/:slug | API key | Queue re-ingestion and re-scoring for a trend. |

## Discovery
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/discover?q=:query | No | Full-text search. |
| GET | /api/discover/categories | No | List categories with counts. |
| GET | /api/discover/new | No | List trends added in the last 7 days. |

## Back-test
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/backtest/results | No | List all backtest results. |
| GET | /api/backtest/results/:slug | No | Get backtest result for one trend. |
| GET | /api/backtest/accuracy | No | Get aggregate backtest accuracy metrics. |

## Alerts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/alerts | No (rate-limited: 10/min) | Create an alert. `triggerStage` must be a valid discourse stage. |
| DELETE | /api/alerts/:id?email=:email | API key | Delete an alert. `email` is used for ownership verification. |
| GET | /api/alerts?email=:email | No | List alerts for an email address. |

## Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Backend service health. |
| GET | /health/nlp | Backend-to-NLP connectivity health. |

## Auth

API key authentication is required for protected write operations. Pass:

`Authorization: Bearer <API_KEY>`

Protected endpoints:

- `POST /api/trends`
- `DELETE /api/trends/:slug`
- `POST /api/scores/trigger/:slug`
- `DELETE /api/alerts/:id`

Rate limits:

- Global: 100 requests/minute
- `POST /api/alerts`: 10 requests/minute

## Interactive Docs
Swagger UI is available at `/api/docs` in development only (disabled when `NODE_ENV=production`).
