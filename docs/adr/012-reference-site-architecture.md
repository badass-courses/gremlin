# ADR-012: Reference Site Architecture (wizardshit-ai + gremlin-cms)

**Status**: Proposed
**Date**: 2026-02-24
**Authors**: @joelhooks

## Context

Gremlin needs executable proof that its multi-framework and provider/adapter decisions are practical, not theoretical.

Current state:

- `apps/wizardshit-ai` exists as Next.js 16 reference implementation
- `@gremlincms/core` and `@gremlincms/db` are shared foundations
- Convex-first provider direction is defined in ADR-010
- Multi-framework direction is defined in ADR-011

Without concrete reference apps, we risk architecture drift, where decisions look clean on paper but fail under real framework constraints.

## Decision

Adopt **two first-class reference sites** as architecture proving grounds:

1. `apps/wizardshit-ai` (Next.js 16)
2. `apps/gremlin-cms` (TanStack Start)

### 1. Shared Domain/Core Contract Across Both Sites

Both reference apps must consume:

- `@gremlincms/core` router procedures
- `@gremlincms/db` adapters

No app-specific forks of domain contracts are allowed.

```ts
// shared usage expectation in both apps
import { appRouter } from "@gremlincms/core/router";
import { ConvexContentResourceAdapter } from "@gremlincms/db";

const contentResources = new ConvexContentResourceAdapter(query, mutate);

const ctx = { contentResources };
await appRouter.listByType.handler({ input: { type: "lesson" }, ctx });
```

### 2. Framework Responsibilities

**wizardshit-ai (Next.js 16)**

- App Router + RSC
- Cache Components best practices
- Existing Vercel deployment path

**gremlin-cms (TanStack Start)**

- TanStack Router for route structure
- TanStack Query for server state patterns
- TanStack Start server functions (`createServerFn`) for server boundaries
- Vercel deployment target at `gremlincms.com`

### 3. Data Provider Strategy

Both reference sites default to Convex adapter usage (ADR-010). Drizzle remains available as an alternate adapter.

### 4. Minimal Required Skeleton for `apps/gremlin-cms`

The initial scaffold includes:

- `package.json`
- `app.config.ts`
- `app/routes/__root.tsx`
- `app/routes/index.tsx`
- `app/client.tsx`
- `app/router.tsx`
- `app/ssr.tsx`
- `tsconfig.json`
- `README.md`

This keeps startup scope minimal while establishing real framework wiring.

### 5. Parity Checklist Between Reference Sites

A feature is considered architecture-ready only when both reference sites can implement it using shared core/db contracts:

- Content listing and detail retrieval
- Auth/session-aware procedure access
- Cache/revalidation strategy appropriate to framework
- Deployable build in Vercel environment

## Consequences

### Positive

- Validates ADR-010 and ADR-011 through running applications
- Exposes integration problems early (routing, context, caching, auth wiring)
- Provides concrete examples for future framework adapter packages
- Improves onboarding: contributors can learn from real app implementations

### Negative

- Duplicates some integration work across two frameworks
- Increases maintenance burden for parity over time
- Requires explicit ownership for reference-app drift prevention

### Neutral

- Reference apps are architecture exemplars, not final product clones
- Framework-specific UX differences are acceptable if core contract parity is preserved
- Additional reference apps can be added later if strategy expands

## Alternatives Considered

### Alternative 1: Single Reference Site (Next.js Only)

Keep only `wizardshit-ai` as the canonical implementation.

**Why rejected**: Cannot validate multi-framework claims or adapter boundaries with one framework.

### Alternative 2: Build `create-badass-app` First

Prioritize a generic app generator before proving parity with two concrete apps.

**Why rejected**: Template-first risks encoding unproven architecture assumptions. Real reference apps should inform templates.

## References

- [ADR-010: Convex-First Database](./010-convex-first-provider-adapter-pattern.md)
- [ADR-011: Multi-Framework Frontend Support](./011-multi-framework-frontend-support.md)
- `apps/wizardshit-ai/`
- `apps/gremlin-cms/` (new scaffold)
- [TanStack Start Docs](https://tanstack.com/start/latest)
- [Next.js 16 Docs](https://nextjs.org/docs)
