# @badass/core

Type-safe router builder with Effect-TS integration.

## Features

- **Type-state pattern** - Compile-time enforcement via `UnsetMarker`
- **Immutable builder chain** - Each method returns new builder
- **Effect integration** - Handlers return `Effect<Output, Error, Requirements>`
- **Middleware composition** - Type-safe context merging
- **Zod validation** - Input/output schema validation

## Installation

```bash
pnpm add @badass/core effect zod
```

## Usage

### Basic Procedure

```typescript
import { procedure } from "@badass/core";
import { Effect } from "effect";
import { z } from "zod";

const getUser = procedure
  .input(z.object({ id: z.string().uuid() }))
  .handler(({ input }) => {
    return Effect.succeed({ id: input.id, name: "Alice" });
  });
```

### With Middleware

```typescript
const authMiddleware = () => ({
  userId: "user-123",
  role: "admin",
});

const updateUser = procedure
  .input(z.object({ id: z.string(), name: z.string() }))
  .use(authMiddleware)
  .handler(({ input, ctx }) => {
    // ctx is type-safe: { userId: string, role: string }
    return Effect.succeed({ ...input, updatedBy: ctx.userId });
  });
```

### Create Router

```typescript
import { createRouter } from "@badass/core";

const router = createRouter({
  getUser,
  updateUser,
  deleteUser: procedure
    .input(z.object({ id: z.string() }))
    .use(authMiddleware)
    .handler(({ input, ctx }) => Effect.succeed({ deleted: true })),
});
```

## Schema Exports

```typescript
import {
  ContentResourceSchema,
  CreateContentResourceSchema,
  UpdateContentResourceSchema,
} from "@badass/core";
```

## Architecture

- `packages/core/src/router/` - Type-state builder implementation
- `packages/core/src/schemas/` - Shared Zod schemas
- **Effect at handler layer only** - Builder stays pure TypeScript
- **Adapters not included** - See `@badass/adapter-*` packages

## Type Inference

```typescript
import type { inferProcedureInput, inferProcedureOutput } from "@badass/core";

type Input = inferProcedureInput<typeof getUser>;
type Output = inferProcedureOutput<typeof getUser>;
```

## Inspiration

Type-state pattern inspired by [uploadthing](https://github.com/pingdotgg/uploadthing).
