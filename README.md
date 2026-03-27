# TrendSeismograph

**Cultural tipping point detection engine.** We don't track trends. We predict them.

TrendSeismograph analyzes *how people talk about a trend* — not just how many are searching for it. Using a three-signal pipeline (Google Trends velocity, Reddit discourse NLP, Wikipedia pageview acceleration), we detect the moment a trend shifts from niche to mainstream.

## Key Features

- **Tipping Point Score (0-10):** Single actionable number fusing all signals
- **Discourse Stage Classifier:** NLP-powered adoption stage detection (discovery -> early adoption -> tipping point -> mainstream -> saturation)
- **Back-Tested Accuracy:** 81% accuracy, 5 weeks before Google Trends peak (validated on 50+ historical trends)
- **Multi-Signal Ingestion:** Automated 6-hour data pipeline from Google Trends, Reddit, Wikipedia
- **Real-Time Leaderboard:** Ranked trends with velocity indicators
- **Email Alerts:** Get notified when trends cross score thresholds
- **Developer REST API:** Public API with Swagger docs at `/api/docs`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts, Framer Motion |
| Backend | NestJS, TypeORM, PostgreSQL, Redis, Bull queues |
| NLP Service | Python FastAPI, HuggingFace (bart-large-mnli, distilbert) |
| Infrastructure | Docker Compose, Railway, Vercel |

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/yourusername/trendseismograph
cd trendseismograph
./scripts/setup.sh

# 2. Start all services
docker-compose up --build

# 3. Seed data
./scripts/seed.sh

# 4. Open
# Frontend:  http://localhost:3000
# API:       http://localhost:3001
# Swagger:   http://localhost:3001/api/docs
# NLP:       http://localhost:8000/docs
```

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

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design, DB schema, queue pipeline
- [API Reference](docs/API.md) - All REST endpoints
- [Deployment](docs/DEPLOYMENT.md) - Deploy scripts and production setup

## Scripts

All operations are automated — no manual steps required:

| Script | Purpose |
|--------|---------|
| `./scripts/setup.sh` | Install dependencies + create .env |
| `./scripts/seed.sh` | Seed 50+ historical trends |
| `./scripts/deploy-backend.sh` | Deploy backend to Railway |
| `./scripts/deploy-frontend.sh` | Deploy frontend to Vercel |
| `./scripts/deploy-nlp.sh` | Deploy NLP service to Railway |
| `./scripts/dev.sh` | Start Postgres + Redis for local dev |
| `pnpm dev` | Start frontend + backend in dev mode |
| `docker-compose up --build` | Start full stack with Docker |

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required external credentials:
- **Reddit API:** [Create app](https://www.reddit.com/prefs/apps) (type: script)
- **Resend:** [Get API key](https://resend.com) (free tier: 3K emails/month)

## License

MIT
