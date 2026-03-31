# Contributing

Thanks for contributing to TrendSeismograph.

## Development Workflow

1. Create a branch from your current base.
2. Keep changes focused and scoped.
3. Run relevant checks and tests before opening a PR.
4. Update documentation in the same PR when behavior changes.

## Local Setup

Use the canonical setup and deployment guide in `docs/DEPLOYMENT.md`.

Quick bootstrap:

```bash
./scripts/setup.sh
```

## Pull Request Expectations

- Include a clear summary of user-facing and technical changes.
- Call out risks, assumptions, and follow-up work.
- Keep commits and file changes logically grouped.
- Ensure endpoint, script, and environment variable changes are documented.

## Documentation Maintenance Rules

- Each topic has one authoritative document.
- Avoid copying large sections between docs.
- Link to the canonical document instead of duplicating detail.

Current ownership:

- Setup, deployment, and environment: `docs/DEPLOYMENT.md`
- API routes and authentication behavior: `docs/API.md`
- Architecture and internals: `docs/ARCHITECTURE.md`
- Testing commands and strategy: `docs/TESTING.md`
- Project entry point and document map: `README.md`

## Testing

Use canonical test commands in `docs/TESTING.md`.
