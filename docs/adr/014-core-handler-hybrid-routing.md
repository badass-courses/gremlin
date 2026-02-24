# ADR-014: Core Handler with Hybrid Routing

**Status**: Proposed
**Date**: 2026-02-24
**Authors**: @joelhooks

## Context

Gremlin needs a framework-agnostic core handler (like Auth.js's `Auth(request, config) → Response`) that the framework packages (`@gremlincms/next`, `@gremlincms/tanstack`) wrap into framework-specific route handlers.

The router in `@gremlincms/core` already defines type-safe procedures with Zod validation and Effect handlers. The question is: how do these procedures map to HTTP?

## Decision

**Hybrid routing**: named RESTful routes for the public API, RPC-style for internal procedure calls.

### Core Handler Shape

```ts
// @gremlincms/core
export function GremlinCMS(request: Request, config: GremlinConfig): Promise<Response>
```

The core handler owns:
- **Cookie read/write** — session tokens, CSRF tokens
- **Route matching** — parses URL path, dispatches to procedures or named routes
- **Middleware execution** — auth checks, rate limiting, logging
- **Effect resolution** — runs Effect programs, serializes results
- **Error handling** — maps Effect failures to HTTP status codes

### Route Structure

```
/api/gremlin/                         ← base path (configurable)

# Named public routes (RESTful)
/api/gremlin/session                  ← GET: current session
/api/gremlin/content/:idOrSlug        ← GET: single resource
/api/gremlin/content                  ← GET: list, POST: create
/api/gremlin/webhook/:provider        ← POST: incoming webhooks (Stripe, etc.)
/api/gremlin/progress/:resourceId     ← GET/POST: progress tracking

# RPC endpoint (internal)
/api/gremlin/rpc                      ← POST: { procedure, input }
```

### Why hybrid?

**Named routes** for:
- Public-facing API that external consumers might use
- Webhook receivers (Stripe needs a stable URL)
- Session management (cookie operations need specific paths)
- SEO-relevant endpoints (sitemaps, feeds)
- Cacheability — GET requests to named routes can be edge-cached

**RPC** for:
- Internal admin operations (CRUD from dashboards)
- Batch operations
- Complex queries with dynamic filters
- Anything the framework packages call programmatically

### Cookie & Session Contract

The core handler manages cookies directly on the `Response`:

```ts
interface GremlinSession {
  user: { id: string; email: string; roles: string[] } | null
  expires: string
}

// Core reads session from cookie, makes it available to procedures
// Procedures access session via middleware context:
const authMiddleware: MiddlewareFn = ({ input }) => {
  const session = getSessionFromCookie(input._request)
  if (!session?.user) throw new UnauthorizedError()
  return { session }
}
```

Session storage is pluggable — could be JWT (stateless) or database-backed via the adapter.

### Framework Package Integration

**`@gremlincms/next`**:
```ts
import { GremlinCMS } from '@gremlincms/core'

export default function NextGremlin(config: GremlinConfig) {
  const handler = (req: NextRequest) => GremlinCMS(req, config)
  return {
    handlers: { GET: handler, POST: handler },
    gremlin: {
      // RSC helper — reads cookies from headers()
      getSession: () => ...,
      getResource: (slug) => ...,
    }
  }
}
```

**`@gremlincms/tanstack`**:
```ts
import { GremlinCMS } from '@gremlincms/core'

export function createGremlinServerFns(config: GremlinConfig) {
  return {
    getSession: createServerFn().handler(() => ...),
    getResource: createServerFn()
      .input(z.object({ slug: z.string() }))
      .handler(({ data }) => ...),
  }
}
```

### Config Shape

```ts
interface GremlinConfig {
  basePath?: string              // default: '/api/gremlin'
  adapters: {
    content: ContentAdapter      // required
    progress?: ProgressAdapter
    commerce?: CommerceAdapter
  }
  router?: Router                // custom procedures
  session?: {
    strategy: 'jwt' | 'database'
    maxAge?: number
    cookie?: CookieConfig
  }
  callbacks?: {
    session?: (params) => Session
    webhook?: (event) => void
  }
}
```

## Consequences

### Easier
- Public API is discoverable and cacheable (named routes)
- Internal operations are flexible (RPC)
- Framework packages stay genuinely thin (~50 lines each)
- Cookie/session logic is centralized, not duplicated per framework
- Webhooks have stable, predictable URLs

### Harder
- Two routing paradigms to maintain (REST + RPC)
- Named routes need to stay in sync with procedure definitions
- Core handler is more complex than pure RPC

## Alternatives Considered

**Pure RPC (tRPC-style)** — simpler implementation but poor for webhooks, caching, and external consumers. Every call is POST to a single endpoint.

**Pure REST** — clean for CRUD but awkward for complex operations, batch queries, and doesn't leverage the existing procedure/Effect infrastructure.

**Framework-specific routing** — each framework package defines its own routes. Rejected because it duplicates cookie/session logic and makes behavior inconsistent across frameworks.
