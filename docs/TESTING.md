# Testing Guide

This is the canonical source for test commands and current test scope.

## Test Commands

Run backend contract tests:

```bash
pnpm --filter @trendseismograph/backend run test:contracts
```

Run lint across the workspace:

```bash
pnpm lint
```

Build all packages:

```bash
pnpm build
```

## Current Coverage

- Backend contract tests validate API error handling and frontend-backend contract behavior.
- There is currently no full e2e suite in this repository.
- Frontend and NLP service currently do not expose dedicated test scripts in package manifests.

## When to Add Tests

Add or extend tests when you change:

- API response shape or endpoint behavior
- scoring formula behavior
- queue orchestration or ingestion flow
- authentication or rate-limit logic
- shared frontend/backend contracts

## CI/Automation Note

If you add new test scripts, also update:

- `README.md` command references
- this file (`docs/TESTING.md`)
- relevant deployment and build workflows
