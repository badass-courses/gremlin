# ADR-011: Multi-Framework Frontend Support

**Status**: Proposed
**Date**: 2026-02-24
**Authors**: @joelhooks

## Context

Gremlin is intended to power multiple creator properties and product surfaces, not a single framework-locked site. We already have:

- A framework-agnostic router/procedure layer in `@gremlincms/core` (ADR-002)
- A database adapter layer in `@gremlincms/db`
- A Next.js 16 reference app (`apps/wizardshit-ai`)

Product direction now requires **framework parity from the beginning**, with immediate focus on:

1. **Next.js 16** (existing app)
2. **TanStack Start** (new `apps/gremlin-cms`)

Future targets are Astro, SolidStart, and SvelteKit. To avoid accidental lock-in, shared packages must remain framework-neutral.

## Decision

Adopt a **multi-framework architecture** with strict boundaries:

### 1. Priority Matrix

- **Priority 1 (now)**: Next.js 16 + TanStack Start
- **Priority 2 (next)**: Astro, SolidStart, SvelteKit

### 2. Framework-Specific Integration Packages

Create adapter packages that translate shared router/db contracts into framework runtime APIs:

- `@gremlincms/next`
- `@gremlincms/tanstack-start`
- (future) `@gremlincms/astro`, `@gremlincms/solidstart`, `@gremlincms/sveltekit`

Each framework package is responsible for:

- Route handler wiring
- Auth/session integration
- Content rendering bridge
- Framework-native caching or data-fetch patterns

### 3. Core Packages Stay Framework-Agnostic

`@gremlincms/core` and `@gremlincms/db` may not import React, Next.js, TanStack Start, Astro, Solid, or SvelteKit packages.

Allowed dependencies in core packages are domain/runtime utilities (Effect, Zod, schema/adapter types), not UI/transport concerns.

### 4. Shared Procedure Definitions Power All Frontends

The router pattern from ADR-002 remains the canonical API contract. Framework adapters call the same procedures.

```ts
// packages/core/src/routes/content.ts
import { createRouter, procedure } from "@gremlincms/core";
import { z } from "zod";

export const contentRouter = createRouter({
  listByType: procedure
    .input(z.object({ type: z.string(), limit: z.number().optional() }))
    .handler(({ input, ctx }) =>
      ctx.contentResources.listContentResources({
        type: input.type,
        limit: input.limit,
      }),
    ),
});
```

**Next.js adapter usage**:

```ts
// packages/next/src/route-handler.ts
import { createNextRouteHandler } from "@gremlincms/next";
import { appRouter } from "@gremlincms/core/router";

export const { GET, POST } = createNextRouteHandler({
  router: appRouter,
  createContext: async (req) => ({
    session: await getSession(req),
    contentResources: makeAdapterForRequest(req),
  }),
});
```

**TanStack Start adapter usage**:

```ts
// packages/tanstack-start/src/server-fn.ts
import { createServerFn } from "@tanstack/react-start";
import { callProcedure } from "@gremlincms/tanstack-start";
import { appRouter } from "@gremlincms/core/router";

export const listLessons = createServerFn({ method: "GET" })
  .validator((input: { limit?: number }) => input)
  .handler(async ({ data, context }) =>
    callProcedure(appRouter, "listByType", {
      input: { type: "lesson", limit: data.limit },
      ctx: context,
    }),
  );
```

### 5. Framework-Specific Runtime Features Are Preserved

- Next.js uses App Router, RSC, and cache components
- TanStack Start uses `createServerFn` + TanStack Router + Query

Both still consume identical `@gremlincms/core` procedures and `@gremlincms/db` adapters.

## Consequences

### Positive

- Reduces strategic risk: no single-framework lock-in
- Enables side-by-side parity testing between frameworks
- Keeps domain logic reusable and testable at package level
- Supports creator preference without rewriting backend/business logic

### Negative

- Adds integration surface area (multiple adapter packages)
- Requires discipline to prevent framework imports leaking into core
- Increases CI/test matrix as additional frameworks come online

### Neutral

- Framework-specific optimizations remain package-specific, not globally uniform
- Developer onboarding includes understanding adapter boundaries
- Additional frameworks can be added incrementally using the same pattern

## Alternatives Considered

### Alternative 1: Next.js Only

Standardize on Next.js and defer all other frameworks.

**Why rejected**: Contradicts platform strategy and reintroduces framework lock-in risk.

### Alternative 2: Remix as Second Framework

Use Remix instead of TanStack Start for parity.

**Why rejected**: TanStack Start aligns better with TanStack Router + Query strategy and current team direction.

### Alternative 3: Framework-Agnostic SPA Only

Ship one SPA shell and avoid framework server runtimes entirely.

**Why rejected**: Weak fit for SEO, server rendering, auth integration, and framework-native platform strengths.

## References

- [ADR-002: Router Pattern](./002-router-pattern.md)
- [ADR-005: Monorepo Structure](./005-monorepo-structure.md)
- `packages/core/src/index.ts`
- `packages/db/src/index.ts`
- [TanStack Start Docs](https://tanstack.com/start/latest)
- [Next.js App Router Docs](https://nextjs.org/docs/app)
