# TrendSeismograph

**Cultural tipping point detection engine.** We don't track trends. We predict them.

TrendSeismograph analyzes *how people talk about a trend*, not just search volume. Using a three-signal pipeline (Google Trends velocity, Reddit discourse NLP, and Wikipedia pageview acceleration), it identifies when a trend moves from niche to mainstream.

## Key Features

- **Tipping Point Score (0-10):** A single actionable score that fuses all signals.
- **Discourse Stage Classifier:** NLP-powered adoption-stage detection (discovery -> early adoption -> tipping point -> mainstream -> saturation).
- **Backtested Accuracy:** 81% accuracy, five weeks before Google Trends peak (validated on 50+ historical trends).
- **Multi-Signal Ingestion:** Automated six-hour pipeline across Google Trends, Reddit, and Wikipedia.
- **Real-Time Leaderboard:** Ranked trends with velocity indicators.
- **Email Alerts:** Notifications when trends cross score thresholds.
- **Developer REST API:** Public API with Swagger docs at `/api/docs` in development.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts, Framer Motion |
| Backend | NestJS, TypeORM, PostgreSQL, Redis, Bull queues |
| NLP Service | Python FastAPI, HuggingFace (bart-large-mnli, distilbert) |
| Infrastructure | Docker Compose, Railway, Vercel |

## Documentation Map

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): system design, module boundaries, queue pipeline, security model, and TPS formula.
- [docs/API.md](docs/API.md): API endpoints, authentication rules, and Swagger usage in development.
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): prerequisites, local and production deployment flow, and environment variable ownership.
- [CONTRIBUTING.md](CONTRIBUTING.md): development workflow, pull request expectations, and documentation standards.
- [docs/TESTING.md](docs/TESTING.md): canonical test commands and current test scope.

## Quick Start

```bash
# 1. Clone and bootstrap
git clone https://github.com/yourusername/trendseismograph
cd trendseismograph
./scripts/setup.sh

# 2. Start local stack
docker compose up --build

# 3. Seed data
./scripts/seed.sh

# 4. Open
# Frontend:  http://localhost:3000
# API:       http://localhost:3001
# Swagger:   http://localhost:3001/api/docs
# NLP:       http://localhost:8000/docs
```

For production deployment and complete environment configuration, use [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Project Structure

```
trendseismograph/
├── apps/
│   ├── backend/        # NestJS API
│   └── frontend/       # Next.js 14
├── services/
│   └── nlp/            # Python FastAPI NLP microservice
├── scripts/            # Automation scripts (setup, deploy, seed)
├── docker-compose.yml  # Full stack orchestration
├── .env.example        # Environment variables template
└── pnpm-workspace.yaml
```

## Scripts

Common commands:

| Script | Purpose |
|--------|---------|
| `./scripts/setup.sh` | Install dependencies + create .env |
| `./scripts/seed.sh` | Seed 50+ historical trends |
| `./scripts/deploy-backend.sh` | Deploy backend to Railway |
| `./scripts/deploy-frontend.sh` | Deploy frontend to Vercel |
| `./scripts/deploy-nlp.sh` | Deploy NLP service to Railway |
| `./scripts/dev.sh` | Start Postgres + Redis for local dev |
| `pnpm dev` | Start frontend + backend in dev mode |
| `docker compose up --build` | Start full stack with Docker |

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

The authoritative environment variable reference (required values, optional defaults, and deployment notes) is in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Documentation Rules

- Each topic has one authoritative document; other docs should link to it rather than duplicate it.
- If behavior changes in code, update the owning document in the same PR.

## License

MIT
