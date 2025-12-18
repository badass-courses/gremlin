# @badass Monorepo

Monorepo for badass course platform packages and apps.

## Quick Start

```bash
# Install dependencies
bun install

# Run development
bun dev

# Run tests
bun test:run

# Run E2E tests
bun e2e
```

## Structure

```
├── apps/
│   └── wizardshit-ai/     # Next.js 16 app
├── packages/
│   ├── core/              # Core types and router
│   └── db/                # Database adapter layer
├── tooling/
│   ├── gh-actions/        # Reusable GitHub Actions
│   └── test-utils/        # Shared test utilities
└── docs/
    └── adr/               # Architecture Decision Records
```

## CI/CD

The CI pipeline runs on every push and PR:

| Workflow | Purpose |
|----------|---------|
| `ci.yaml` | Build, lint, typecheck, unit tests |
| `e2e.yaml` | Playwright E2E tests with sharding |

### Required Secrets

To enable Turborepo remote caching, add these to your GitHub repo:

| Secret/Variable | Type | Description |
|-----------------|------|-------------|
| `TURBO_TOKEN` | Secret | Vercel Turborepo token |
| `TURBO_TEAM` | Variable | Vercel team slug |

**Get your token:**
1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create a new token with Turborepo scope
3. Add as `TURBO_TOKEN` secret in GitHub repo settings

**Get your team slug:**
1. Go to your Vercel team settings
2. Copy the team URL slug (e.g., `my-team`)
3. Add as `TURBO_TEAM` variable in GitHub repo settings

### Intelligent Test Selection

The E2E workflow uses:
- **Change detection**: Only runs E2E when `apps/` or `packages/` change
- **Sharding**: Splits tests across 2 parallel runners
- **`--only-changed`**: On PRs, runs only tests affected by changes
- **Blob reports**: Merges sharded results into single HTML report

## Scripts

```bash
# Development
bun dev              # Start all apps in dev mode
bun build            # Build all packages and apps

# Testing
bun test             # Run unit tests (watch mode)
bun test:run         # Run unit tests once
bun test:coverage    # Run with coverage
bun e2e              # Run E2E tests

# Code Quality
bun lint             # Run linters
bun format           # Format code
bun format:check     # Check formatting (CI)
bun typecheck        # Type check with tsgo

# Releases
bun changeset        # Create a changeset
bun version          # Version packages
bun release          # Publish to npm
```

## Architecture Decisions

See [docs/adr/](docs/adr/) for architecture decision records.

Key decisions:
- **ADR-001**: Auth uses Hive + Spoke model with BetterAuth
