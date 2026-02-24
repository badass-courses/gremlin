# ADR-015: Architecture Reconciliation

**Status**: Proposed
**Date**: 2026-02-24
**Authors**: @joelhooks

## Context

Codex review of ADRs 010–014 against the existing codebase surfaced 12 issues across 6 categories: naming drift, missing execution engine, auth ownership conflict, config inconsistency, pagination gaps, and Effect boundary leakage. This ADR resolves all of them with canonical decisions.

## Decisions

### 1. Canonical Interface Naming

**Problem**: ADR-013 uses `getResource/addChild`, code uses `getContentResource/addResourceToResource`.

**Decision**: Keep the existing code names. They're explicit and avoid ambiguity when multiple adapter domains exist.

```ts
// Canonical names (already in packages/db/src/adapter/interface.ts)
getContentResource()
listContentResources()
createContentResource()
updateContentResource()
deleteContentResource()
addResourceToResource()
removeResourceFromResource()
reorderResource()
```

ADR-013 shorthand was illustrative, not prescriptive. Update ADR-013 examples to match code.

### 2. Canonical Config Shape

**Problem**: Config differs between ADRs (top-level adapters vs nested `adapters` bag).

**Decision**: Single canonical `GremlinConfig` type. Adapters nested under `adapters` key. All ADRs reference this.

```ts
interface GremlinConfig {
  basePath?: string                          // default: '/api/gremlin'
  adapters: {
    content: ContentAdapter                  // required
    progress?: ProgressAdapter               // optional
    commerce?: CommerceAdapter               // optional
    communication?: CommunicationAdapter     // optional
  }
  auth: SessionProvider                      // required — see §3
  router?: Router                            // custom procedures
  callbacks?: {
    onWebhook?: (event: WebhookEvent) => void
    onError?: (error: GremlinError) => void
  }
}
```

### 3. Auth: Interface Dependency, Not Hard Dependency

**Problem**: ADR-014 reinvents session/cookie handling. ADR-001 chose BetterAuth. These conflict.

**Decision**: Core defines a `SessionProvider` interface. BetterAuth is the default/recommended implementation but is NOT a hard dependency of `@gremlincms/core`.

```ts
interface GremlinSession {
  user: {
    id: string
    email?: string
    name?: string
    image?: string
    roles: string[]
  } | null
  expires: string
}

interface SessionProvider {
  /** Get session from request (reads cookies/headers) */
  getSession(request: Request): Promise<GremlinSession>
  /** Get session or throw UnauthorizedError */
  requireSession(request: Request): Promise<GremlinSession & { user: NonNullable<GremlinSession['user']> }>
}
```

BetterAuth adapter lives in a separate package or utility:

```ts
// @gremlincms/auth-betterauth (or inline helper)
export function createBetterAuthProvider(authInstance): SessionProvider {
  return {
    getSession: (req) => authInstance.api.getSession({ headers: req.headers }),
    requireSession: (req) => { ... },
  }
}
```

Core handler calls `config.auth.getSession(request)` — never imports BetterAuth directly.

### 4. Execution Engine

**Problem**: Router builds procedure metadata but nothing runs them. No input validation, no middleware execution, no Effect resolution.

**Decision**: Add `executeProcedure()` and `createHttpHandler()` to `@gremlincms/core`.

```ts
// Execute a single procedure
async function executeProcedure<T>(
  procedure: Procedure<any>,
  input: unknown,
  context: ExecutionContext,
): Promise<T>

// Context passed to middleware and handlers
interface ExecutionContext {
  request: Request
  session: GremlinSession
  headers: Headers
}

// Create framework-agnostic HTTP handler
function createHttpHandler(config: GremlinConfig): (request: Request) => Promise<Response>
```

Execution pipeline:
1. Route match (named route or RPC)
2. `zod.safeParse(input)` → validation error if fails
3. Middleware chain (composed, not overwritten — see §7)
4. `Effect.runPromise(handler({ input, ctx }))` → resolve Effect
5. Serialize result to Response
6. Map errors to HTTP status (see §5)

### 5. Error Taxonomy

**Problem**: No shared error types. Can't map failures to HTTP status.

**Decision**: Define `GremlinError` with codes that map deterministically to HTTP status.

```ts
type GremlinErrorCode =
  | 'NOT_FOUND'        // 404
  | 'UNAUTHORIZED'     // 401
  | 'FORBIDDEN'        // 403
  | 'VALIDATION'       // 400
  | 'CONFLICT'         // 409
  | 'INTERNAL'         // 500

class GremlinError extends Error {
  constructor(
    public code: GremlinErrorCode,
    message: string,
    public cause?: unknown,
  ) {
    super(message)
  }
}
```

Adapters and handlers throw `GremlinError`. Execution engine catches and maps to HTTP Response.

### 6. Pagination: Cursor-First

**Problem**: Array-only returns with limit/offset. Weak for Convex (no offset support).

**Decision**: Standard `Page<T>` response. Cursor-first with optional offset shim.

```ts
interface Page<T> {
  items: T[]
  cursor?: string       // opaque cursor for next page
  hasMore: boolean
}

interface PaginationParams {
  cursor?: string       // preferred
  limit?: number        // default: 20, max: 100
  offset?: number       // fallback for SQL adapters
}
```

`listContentResources` returns `Page<ContentResourceWithResources>` instead of raw array. Convex adapter uses Convex cursors natively. Drizzle adapter uses offset internally.

### 7. Middleware Composition

**Problem**: `.use()` overwrites previous middleware instead of composing.

**Decision**: Store middleware as ordered array. Execute sequentially, merge contexts.

```ts
// Builder stores array
_def: {
  middlewares: MiddlewareFn[]  // plural, ordered
  // ...
}

// .use() appends, not replaces
use(middleware) {
  return createBuilderInternal({
    ..._def,
    middlewares: [...(_def.middlewares ?? []), middleware],
  })
}
```

Executor runs middlewares left-to-right, merging returned contexts:

```ts
let ctx = {}
for (const mw of procedure._def.middlewares) {
  const result = await mw({ input, ctx })
  ctx = { ...ctx, ...result }
}
```

### 8. Effect Boundary

**Problem**: Effect leaks into framework packages. Forces framework adapters to know Effect internals.

**Decision**: Keep Effect internal to core execution. Framework-facing API is Promise-based.

- `executeProcedure()` returns `Promise<T>`, not `Effect<T>`
- Handler functions may return `Effect` or `Promise` — executor normalizes both
- Framework packages never import `effect`

```ts
// Handler can return either
type HandlerReturn<T> = Effect.Effect<T, unknown, unknown> | Promise<T> | T

// Executor normalizes
if (Effect.isEffect(result)) {
  return Effect.runPromise(result)
}
return result
```

### 9. Framework Package Naming

**Problem**: Inconsistent (`tanstack` vs `tanstack-start`).

**Decision**: `@gremlincms/tanstack` (short). It wraps TanStack Start specifically but the package name stays concise. Similarly `@gremlincms/next` (not `@gremlincms/nextjs`).

### 10. ADR Snippet Corrections

Update code examples in ADRs 010, 012, 013 to use:
- Correct package import paths (`@gremlincms/convex-adapter`, not `@gremlincms/db`)
- Function-reference config for Convex adapter (matching actual implementation)
- Canonical `GremlinConfig` shape from §2

## Consequences

### Easier
- Single source of truth for config, naming, errors, pagination
- Framework packages stay thin (Promise API, no Effect knowledge)
- Auth is swappable without touching core
- Middleware composes naturally
- Adapters have clear error contract

### Harder
- Execution engine is new code to write and test
- Two handler return types (Effect | Promise) adds complexity to executor
- Cursor pagination requires adapter-specific implementation

## Implementation Order

1. Error taxonomy (`GremlinError` + codes)
2. Pagination types (`Page<T>`, `PaginationParams`)
3. `SessionProvider` interface
4. Fix middleware composition (array, not overwrite)
5. Build execution engine (`executeProcedure`, `createHttpHandler`)
6. Update existing adapter interfaces for pagination
7. Update ADR snippets
8. Framework packages (`@gremlincms/next`, `@gremlincms/tanstack`)
