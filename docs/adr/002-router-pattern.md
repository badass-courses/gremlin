# ADR-002: Router Pattern - Effect-TS Type-State Builder

**Status**: Accepted
**Date**: 2024-12-18
**Authors**: @joelhooks

## Context

We need a pattern for defining type-safe API procedures that:

1. Validates input at runtime with full type inference
2. Supports middleware composition (auth, logging, etc.)
3. Returns typed errors via Effect
4. Works across different transport layers (HTTP, tRPC, direct calls)

The legacy course-builder uses tRPC, which is excellent but tightly coupled to its own transport. We want the procedure definition pattern without the transport lock-in.

## Decision

Adopt a **type-state builder pattern** inspired by tRPC but using Effect for error handling:

```typescript
const getUserProcedure = procedure
  .input(z.object({ id: z.string() }))
  .use(authMiddleware)
  .handler(async ({ input, ctx }) => {
    return Effect.succeed({ user: await getUser(input.id) })
  })
```

Key design choices:

1. **Immutable builder chain** - Each method returns a new builder instance
2. **Type-state tracking** - TypeScript tracks which methods have been called
3. **Zod for input validation** - Runtime validation with inferred types
4. **Effect for handlers** - Typed errors, dependency injection, composability
5. **Transport-agnostic** - Procedures are pure definitions, adapters handle transport

### Implementation

```typescript
// Types track builder state
type ProcedureBuilder<TParams extends AnyParams> = {
  input<TInput extends z.ZodType>(schema: TInput): ProcedureBuilder<...>
  use<TNewContext>(middleware: MiddlewareFn<...>): ProcedureBuilder<...>
  handler<TOutput>(fn: HandlerFn<...>): Procedure<...>
}

// Router is just a record of procedures
function createRouter<T extends Record<string, Procedure>>(procedures: T): T
```

## Consequences

### Benefits

- **Full type inference** - Input, output, context all inferred
- **Composable middleware** - Stack middleware with `.use()`
- **Effect integration** - Typed errors, services, resource management
- **Transport flexibility** - Same procedures work with HTTP, WebSocket, direct calls
- **Testable** - Procedures are pure functions, easy to unit test

### Trade-offs

- **Learning curve** - Developers need to understand Effect
- **More verbose** - Compared to plain functions, builder pattern adds ceremony
- **Type complexity** - Type-state tracking creates complex type signatures

### What This Enables

- Adapters for Next.js API routes, tRPC, Hono, etc.
- Shared procedure definitions between server and client
- Automatic OpenAPI generation from procedure definitions
- Type-safe RPC without code generation

## Alternatives Considered

### 1. Plain tRPC

**Rejected because**: Transport lock-in, doesn't use Effect for error handling.

### 2. Hono RPC

**Rejected because**: Tied to Hono's router, less flexible middleware composition.

### 3. Plain functions with manual validation

**Rejected because**: No type inference, repetitive validation boilerplate.

## References

- [tRPC](https://trpc.io/) - Inspiration for builder pattern
- [Effect](https://effect.website/) - Error handling and services
- [Type-State Pattern](https://ybogomolov.me/type-state-pattern-in-typescript) - Builder type safety
