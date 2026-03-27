# API Reference

Base URL: `http://localhost:3001` (dev) or deployed URL

## Trends
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/trends | No | List all (paginated, ?stage=&category=&page=&limit=) |
| GET | /api/trends/:slug | No | Single trend + latest score |
| GET | /api/trends/:slug/history | No | Time-series (90 days default, ?days=) |
| GET | /api/trends/:slug/reddit | No | Reddit discourse samples |
| POST | /api/trends | API Key | Add new trend |
| DELETE | /api/trends/:slug | API Key | Stop tracking |

## Scoring
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/scores/leaderboard | No | Top 20 by TPS |
| GET | /api/scores/tipping | No | All tipping_point stage trends |
| GET | /api/scores/rising | No | Fastest rising (velocity) |
| POST | /api/scores/trigger/:slug | API Key | Force re-score |

## Discovery
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/discover?q=:query | No | Full-text search |
| GET | /api/discover/categories | No | All categories + counts |
| GET | /api/discover/new | No | Trends added in last 7 days |

## Back-test
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/backtest/results | No | All back-test results |
| GET | /api/backtest/results/:slug | No | Specific trend back-test |
| GET | /api/backtest/accuracy | No | Aggregate accuracy stats |

## Alerts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/alerts | No (rate-limited: 10/min) | Create alert. `triggerStage` must be a valid discourse stage. |
| DELETE | /api/alerts/:id?email=:email | API Key | Delete alert. Email query param used for ownership verification. |
| GET | /api/alerts?email=:email | No | List user alerts |

## Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | NestJS health |
| GET | /health/nlp | Python service health |

## Auth
API Key required for write operations. Pass as `Authorization: Bearer <API_KEY>`.

## Interactive Docs
Swagger UI available at `/api/docs` when backend is running.
