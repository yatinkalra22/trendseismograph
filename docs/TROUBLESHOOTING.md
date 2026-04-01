# Troubleshooting

This guide covers common setup and runtime issues.

## 1. Docker Compose fails before startup

Symptoms:

- `docker compose up --build` exits early
- Error mentions missing `POSTGRES_PASSWORD` or `REDIS_PASSWORD`

Cause:

- Required values are missing from `.env`

Fix:

1. Copy `.env.example` to `.env` if needed:

```bash
cp .env.example .env
```

1. Set at least:

- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `DATABASE_URL`
- `REDIS_URL`
- `API_KEY_SECRET`

1. Restart:

```bash
docker compose up --build
```

## 2. NLP service takes a long time to become healthy

Symptoms:

- Backend waits on `nlp-service` health
- First startup appears stuck for up to a minute

Cause:

- NLP container downloads/loads large HuggingFace models on first run

Fix:

- Wait for health checks to pass on first startup
- Check NLP logs:

```bash
docker compose logs -f nlp-service
```

## 3. Seed script fails

Symptoms:

- `./scripts/seed.sh` fails with container or connection errors

Cause:

- Backend container is not running yet

Fix:

1. Start containers:

```bash
docker compose up -d
```

1. Confirm backend is up:

```bash
docker compose ps
```

1. Re-run:

```bash
./scripts/seed.sh
```

## 4. Frontend cannot reach backend in non-local deployment

Symptoms:

- Frontend API calls fail in deployed environment
- Requests target `http://localhost:3001`

Cause:

- `NEXT_PUBLIC_API_URL` is set to localhost for a deployed frontend

Fix:

- Set `NEXT_PUBLIC_API_URL` to your public backend URL in frontend deployment environment settings
- Rebuild/redeploy frontend

## 5. `/health/nlp` reports NLP unreachable

Symptoms:

- `GET /health` is OK but `GET /health/nlp` returns error/unreachable

Cause:

- NLP service not running, wrong service URL, or service secret mismatch

Fix:

1. Confirm NLP service is running.
2. Verify backend env values:

- `NLP_SERVICE_URL`
- `NLP_SERVICE_SECRET`

1. Verify NLP service has matching `NLP_SERVICE_SECRET`.

## 6. API key protected endpoint returns 401

Symptoms:

- `POST /api/trends`, `POST /api/scores/trigger/:slug`, or delete endpoints return unauthorized

Cause:

- Missing or invalid bearer token

Fix:

- Send header:

```text
Authorization: Bearer <API_KEY_SECRET>
```

- Ensure backend `API_KEY_SECRET` matches the value you use

## 7. Contract tests fail in CI or local

Symptoms:

- `pnpm --filter @trendseismograph/backend run test:contracts` fails

Cause:

- API contract shape changed without synchronized update

Fix:

1. Review changed backend contracts and endpoint response shape.
2. Update frontend/backend shared contract expectations.
3. Re-run contract tests.

## Still blocked?

Collect and share:

- Command used
- Full error output
- `docker compose ps`
- Relevant service logs (`docker compose logs <service>`)
