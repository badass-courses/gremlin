# ADR-013: Domain-Scoped Adapter Interfaces

**Status**: Proposed
**Date**: 2026-02-24
**Authors**: @joelhooks

## Context

course-builder accumulated 50 Drizzle schemas across 7 domains (auth, commerce, communication, content, entitlements, org). Each schema had its own table-level operations scattered across a single monolithic adapter. This made the adapter surface area unwieldy — implementing a new adapter (e.g., Convex) meant touching dozens of methods, most of which weren't needed for initial functionality.

Gremlin needs a cleaner boundary. The adapter interface should be organized by **domain**, not by table, with each domain defining a focused set of operations (~5-8 methods).

## Decision

Organize adapter interfaces into domain-scoped contracts:

### Required Adapters

**ContentAdapter** — Core content operations
- `getResource(idOrSlug, options?)` — get by ID or slug with optional depth
- `listResources(filters?, options?)` — filtered listing with pagination
- `createResource(data)` — create content resource
- `updateResource(id, data)` — partial update
- `deleteResource(id)` — soft delete
- `addChild(parentId, childId, data?)` — create relationship
- `removeChild(parentId, childId)` — delete relationship
- `reorderChild(parentId, childId, position)` — reorder

This is what `@gremlincms/db`'s `ContentResourceAdapter` already defines. It stays as-is.

**ProgressAdapter** — Learning progress tracking
- `getProgress(userId, resourceId)` — single resource progress
- `listProgress(userId, filters?)` — user's progress across resources
- `markComplete(userId, resourceId)` — mark resource completed
- `updateProgress(userId, resourceId, data)` — update progress state (position, percentage)
- `resetProgress(userId, resourceId?)` — reset single or all progress

### Optional Adapters (implement when needed)

**CommerceAdapter** — Purchases and access
- `createPurchase(userId, productId, data)` — record a purchase
- `getPurchase(id)` — get purchase details
- `listPurchases(userId?)` — list purchases
- `checkAccess(userId, resourceId)` — does user have access?
- `applyDiscount(code, productId)` — validate and apply coupon
- `getProduct(idOrSlug)` — get product with pricing
- `listProducts(filters?)` — list products

**CommunicationAdapter** — Comments and notifications
- `addComment(userId, resourceId, data)` — add comment
- `listComments(resourceId, filters?)` — list comments
- `updatePreferences(userId, prefs)` — notification preferences

### Auth is NOT an adapter domain

Auth is handled by BetterAuth (ADR-001). Gremlin consumes BetterAuth's session/user APIs directly. No auth adapter interface — this avoids reimplementing what BetterAuth already handles well.

### Adapter Composition

The main config accepts adapters as a bag:

```ts
interface GremlinConfig {
  content: ContentAdapter       // required
  progress?: ProgressAdapter    // optional
  commerce?: CommerceAdapter    // optional
  communication?: CommunicationAdapter  // optional
}
```

Each adapter package (`@gremlincms/convex-adapter`, `@gremlincms/drizzle-adapter`) exports factory functions for the domains it supports:

```ts
// @gremlincms/convex-adapter
export function createConvexContentAdapter(client, fns): ContentAdapter
export function createConvexProgressAdapter(client, fns): ProgressAdapter
export function createConvexCommerceAdapter(client, fns): CommerceAdapter
```

## Consequences

### Easier
- New adapter implementations start with just `ContentAdapter` (~8 methods)
- Optional domains can be added incrementally
- Each domain interface is small enough to test thoroughly
- Convex adapter doesn't need to implement commerce day 1

### Harder
- Cross-domain operations (e.g., "does user have access to this content?") need to compose multiple adapters
- Some queries that span domains may be less efficient than a single monolithic adapter

## Alternatives Considered

**Single monolithic adapter** (course-builder pattern) — rejected because it creates a ~50-method interface that's painful to implement and test. Most apps only need content + progress initially.

**Per-table interfaces** — rejected because it's too granular. Tables are implementation details; domains are the meaningful boundary.
