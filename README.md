# TrendSeismograph

**Cultural tipping point detection engine.** We don't track trends. We predict them.

TrendSeismograph analyzes *how people talk about a trend*, not just search volume. Using a three-signal pipeline (Google Trends velocity, Reddit discourse NLP, and Wikipedia pageview acceleration), it identifies when a trend moves from niche to mainstream.

> **ZerveHack 2026 note — Reddit pipeline is dormant.** Reddit API access was not granted for this hackathon, so the discourse signal in the active submission has been swapped to **YouTube Data API v3** (search + top comments) with **GDELT 2.0** as a secondary news-volume signal. The Reddit fetcher, scoring fields, and DB columns remain in this repo as reference for the original architecture, but they receive no live data. The hackathon submission lives in [`zerve/cells/`](zerve/cells/) and follows the roadmap in [`docs/winning-plan.md`](docs/winning-plan.md).

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

- [zerve/cells/](zerve/cells/): the 13-block Zerve project that is the actual ZerveHack 2026 submission (ingestion → NLP → scoring → backtest → API → app).
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): system design, module boundaries, queue pipeline, security model, and TPS formula.
- [docs/ENV_GUIDE.md](docs/ENV_GUIDE.md): step-by-step instructions for obtaining Reddit, Resend, and database keys.
- [docs/API.md](docs/API.md): API endpoints, authentication rules, and Swagger usage in development.
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): prerequisites, local and production deployment flow, and environment variable ownership.
- [CONTRIBUTING.md](CONTRIBUTING.md): development workflow, pull request expectations, and documentation standards.
- [docs/TESTING.md](docs/TESTING.md): canonical test commands and current test scope.
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md): common setup and runtime failures with practical fixes.
- [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md): pre-release quality, deployment, and rollback checks.

## Quick Start

### 1. Bootstrap
Run the setup script. This will:
- Check for required tools (Node, pnpm, Docker).
- Create your `.env` file from the example.
- Install all project dependencies (pnpm install).

```bash
./scripts/setup.sh
```

### 2. Configure Environment
Open the newly created `.env` file and fill in your secrets. **For a step-by-step guide on how to get your Reddit and Resend keys, see [docs/ENV_GUIDE.md](docs/ENV_GUIDE.md).**

### 3. Verify and Start
Once your `.env` is ready, start the **infrastructure only** (Postgres & Redis) and verify connectivity:

```bash
# Start only the databases (Postgres & Redis)
pnpm dev:infra

# Verify connections and environment config
./scripts/check-env.sh

# Seed initial trend data
./scripts/seed.sh
```

### 4. Run Development Services
Now start the Backend, Frontend, and NLP service in a single terminal:

```bash
pnpm dev
```

- **Frontend:** http://localhost:3000
- **API:**      http://localhost:3001
- **Swagger:**  http://localhost:3001/api/docs
- **NLP:**      http://localhost:8000/docs

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
