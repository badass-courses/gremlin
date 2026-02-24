# gremlin-cms

Reference implementation of the @gremlincms platform using **TanStack Start**.

- **Framework**: TanStack Start (React + TanStack Router + Vite)
- **Database**: Convex via `@gremlincms/convex-adapter` (ADR-010)
- **Domain**: gremlincms.com

## Development

```bash
pnpm dev     # Start dev server on port 3000
pnpm build   # Production build
pnpm preview # Preview production build
```

## Architecture

This app proves the multi-framework strategy (ADR-011) alongside `apps/wizardshit-ai` (Next.js 16). Both consume shared `@gremlincms/core` and `@gremlincms/db` packages.
