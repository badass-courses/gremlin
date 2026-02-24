# ADR-010: Convex-First Database with Provider/Adapter Pattern

**Status**: Proposed
**Date**: 2026-02-24
**Authors**: @joelhooks

## Context

Gremlin currently has a database abstraction in `@gremlincms/db` with:

- `ContentResourceAdapter` as the contract in `packages/db/src/adapter/interface.ts`
- `DrizzleContentResourceAdapter` as the current implementation in `packages/db/src/adapter/drizzle.ts`
- `content_resource` and `content_resource_resource` as the canonical storage model in Drizzle schema files

That architecture already gives us a clean seam, but product direction now requires a primary backend optimized for:

1. **Realtime UX** for authoring and live content views
2. **Low operational burden** for early sites
3. **Fast shipping** for `apps/wizardshit-ai` and `apps/gremlin-cms`
4. **Preserved backend portability** so we can keep Drizzle and add future providers

Convex is a strong fit for early-stage delivery because it provides subscriptions, indexed queries, and hosted infrastructure with minimal setup. At the same time, we cannot regress portability by hard-coding Convex into core domain code.

## Decision

Adopt a **Convex-first provider strategy** while keeping the existing **provider/adapter pattern** (ports/adapters) as the non-negotiable boundary.

### 1. Adapter Contract Stays the Port

`ContentResourceAdapter` remains the source-of-truth contract for resource CRUD, nesting, and ordering.

```ts
export interface ContentResourceAdapter {
  getContentResource(
    idOrSlug: string,
    options?: LoadResourceOptions,
  ): Promise<ContentResourceWithResources | null>;

  listContentResources(
    filters?: {
      type?: string;
      createdById?: string;
      limit?: number;
      offset?: number;
    },
    options?: LoadResourceOptions,
  ): Promise<ContentResourceWithResources[]>;

  createContentResource(data: NewContentResource): Promise<ContentResource>;
  updateContentResource(id: string, data: Partial<NewContentResource>): Promise<ContentResource>;
  deleteContentResource(id: string): Promise<boolean>;

  addResourceToResource(
    resourceOfId: string,
    resourceId: string,
    data?: Partial<NewContentResourceResource>,
  ): Promise<ContentResourceResource>;

  removeResourceFromResource(resourceOfId: string, resourceId: string): Promise<boolean>;
  reorderResource(
    resourceOfId: string,
    resourceId: string,
    newPosition: number,
  ): Promise<ContentResourceResource>;
}
```

### 2. Add Convex Adapter Without Removing Drizzle

Create `packages/convex-adapter/` as a standalone package (`@gremlincms/convex-adapter`) implementing `ContentResourceAdapter`.

Similarly, extract the existing Drizzle adapter into `packages/drizzle-adapter/` (`@gremlincms/drizzle-adapter`). The `packages/db/` package retains the interface, shared types, and utilities — but no concrete adapter implementations.

Each adapter is its own publishable package with its own dependencies, so apps only pull in the backend they use.

```ts
// packages/convex-adapter/src/index.ts
import type {
  ContentResource,
  ContentResourceResource,
  NewContentResource,
  NewContentResourceResource,
} from "../schema/index.js";
import type {
  ContentResourceAdapter,
  ContentResourceWithResources,
  LoadResourceOptions,
} from "./interface.js";

export class ConvexContentResourceAdapter implements ContentResourceAdapter {
  constructor(
    private readonly query: <T>(name: string, args: Record<string, unknown>) => Promise<T>,
    private readonly mutate: <T>(name: string, args: Record<string, unknown>) => Promise<T>,
  ) {}

  async getContentResource(
    idOrSlug: string,
    options: LoadResourceOptions = {},
  ): Promise<ContentResourceWithResources | null> {
    return this.query<ContentResourceWithResources | null>("contentResource.get", {
      idOrSlug,
      depth: options.depth ?? 0,
    });
  }

  async listContentResources(
    filters = {},
    options: LoadResourceOptions = {},
  ): Promise<ContentResourceWithResources[]> {
    return this.query<ContentResourceWithResources[]>("contentResource.list", {
      ...filters,
      depth: options.depth ?? 0,
    });
  }

  async createContentResource(data: NewContentResource): Promise<ContentResource> {
    return this.mutate<ContentResource>("contentResource.create", { data });
  }

  async updateContentResource(
    id: string,
    data: Partial<NewContentResource>,
  ): Promise<ContentResource> {
    return this.mutate<ContentResource>("contentResource.update", { id, data });
  }

  async deleteContentResource(id: string): Promise<boolean> {
    return this.mutate<boolean>("contentResource.softDelete", { id });
  }

  async addResourceToResource(
    resourceOfId: string,
    resourceId: string,
    data: Partial<NewContentResourceResource> = {},
  ): Promise<ContentResourceResource> {
    return this.mutate<ContentResourceResource>("contentResourceResource.add", {
      resourceOfId,
      resourceId,
      data,
    });
  }

  async removeResourceFromResource(
    resourceOfId: string,
    resourceId: string,
  ): Promise<boolean> {
    return this.mutate<boolean>("contentResourceResource.remove", {
      resourceOfId,
      resourceId,
    });
  }

  async reorderResource(
    resourceOfId: string,
    resourceId: string,
    newPosition: number,
  ): Promise<ContentResourceResource> {
    return this.mutate<ContentResourceResource>("contentResourceResource.reorder", {
      resourceOfId,
      resourceId,
      newPosition,
    });
  }
}
```

### 3. Package Topology

```
packages/
├── db/                  # @gremlincms/db — interface, shared types, position utils
├── convex-adapter/      # @gremlincms/convex-adapter — Convex implementation
├── drizzle-adapter/     # @gremlincms/drizzle-adapter — Drizzle implementation (extracted from current db/)
```

`@gremlincms/db` exports the `ContentResourceAdapter` interface and shared types. Each adapter package depends on `@gremlincms/db` for the interface and implements it independently. Apps declare which adapter they need:

```json
// apps/wizardshit-ai/package.json
{ "dependencies": { "@gremlincms/db": "workspace:*", "@gremlincms/convex-adapter": "workspace:*" } }
```

### 4. Convex as Primary Backend for Initial Sites

`apps/wizardshit-ai` and `apps/gremlin-cms` default to Convex for production paths. Drizzle remains supported for alternate deployments and future portability.

### 5. Convex-Specific Advantages Are Leveraged in Adapters/Providers, Not Core

- Realtime subscriptions are consumed in framework adapters and UI integration points
- Full-text/search indexing is implemented through Convex functions and indexes
- No Convex imports appear in `@gremlincms/core`

## Consequences

### Positive

- Aligns with current product need: fast shipping with realtime-first capabilities
- Keeps architecture honest: domain logic depends on a port, not an ORM/backend
- Preserves existing Drizzle investment and migration path
- Makes backend selection an app-level decision, not a core rewrite

### Negative

- Adds maintenance overhead (two adapters must stay behaviorally aligned)
- Requires contract-level test coverage to prevent provider drift
- Team must understand Convex data/function model in addition to SQL workflows

### Neutral

- `@gremlincms/db` becomes a multi-provider package by design
- Some features (search/subscriptions) remain provider-optimized and may not be perfectly identical across adapters
- Future providers can be added without changing core contracts

## Alternatives Considered

### Alternative 1: Drizzle-Only

Keep Drizzle as the single backend and defer Convex.

**Why rejected**: Slower path to realtime and higher infrastructure/ops surface for first sites.

### Alternative 2: Supabase

Adopt Supabase Postgres + realtime as primary backend.

**Why rejected**: Good platform, but Convex offers a tighter integrated function + realtime model for our immediate needs.

### Alternative 3: Firebase

Use Firestore and Firebase Auth as the primary backend stack.

**Why rejected**: Data modeling and query ergonomics diverge from our current ContentResource shape and adapter interfaces.

### Alternative 4: PocketBase

Use PocketBase for rapid local-first backend delivery.

**Why rejected**: Smaller ecosystem and weaker long-term fit for our multi-site scale/portability goals.

## References

- `packages/db/src/adapter/interface.ts`
- `packages/db/src/adapter/drizzle.ts`
- `packages/db/src/schema/content-resource.ts`
- `packages/db/src/schema/content-resource-resource.ts`
- [Convex Docs](https://docs.convex.dev/)
- [ADR-003: Content Model](./003-content-model.md)
