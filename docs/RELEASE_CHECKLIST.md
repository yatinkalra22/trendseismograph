# Release Checklist

Use this checklist before cutting a release or deploying substantial changes.

## 1. Code and Build Health

- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] `pnpm --filter @trendseismograph/backend run test:contracts` passes
- [ ] `pnpm run docs:check` passes

## 2. Database and Data Safety

- [ ] Migration changes are reviewed
- [ ] New migrations run cleanly in a staging-like environment
- [ ] `synchronize` remains disabled
- [ ] Seed behavior validated if schema changes affect seed data

## 3. Configuration and Secrets

- [ ] Required environment variables are present
- [ ] Production secrets are set via deployment platform (not hardcoded)
- [ ] `NEXT_PUBLIC_API_URL` points to public backend URL in frontend deployment
- [ ] `NLP_SERVICE_SECRET` matches between backend and NLP service

## 4. Service Health and Connectivity

- [ ] `GET /health` returns OK after deploy
- [ ] `GET /health/nlp` confirms backend-to-NLP connectivity
- [ ] Core flows validated: trend list, trend detail, scoring endpoints, alerts creation

## 5. Documentation and Change Communication

- [ ] Relevant docs updated in same PR (`README.md`, `docs/*`, `CONTRIBUTING.md`)
- [ ] New/changed endpoints reflected in `docs/API.md`
- [ ] Setup/deployment/env changes reflected in `docs/DEPLOYMENT.md`
- [ ] Release notes or deployment summary shared with team

## 6. Rollback Preparedness

- [ ] Last known good deployment identified
- [ ] Rollback command/path documented for each deployed service
- [ ] Owner on-call for post-release validation window
