# ADR-008: App Template Architecture

**Status**: Accepted
**Date**: 2024-12-18
**Authors**: @joelhooks

## Context

Creators building @badass apps (courses, products, workshops) follow a common pattern:

1. **Landing page** - Marketing site with product info
2. **Email capture** - Build audience before/during launch
3. **Blog/Content** - SEO, thought leadership, course previews
4. **Collections** - Group related posts (series, categories, paths)

Current workflow is manual copy-paste from existing projects, leading to:

- **Inconsistent structure** - Each new site has subtle differences
- **Copy-paste errors** - Missing files, outdated dependencies, configuration drift
- **Slow setup** - 30+ minutes to scaffold a new project manually
- **No upgrade path** - Fixes/improvements don't propagate to existing sites

**Goal**: Standard app template that new projects can scaffold from, like `create-next-app` or `create-t3-app`.

## Decision

Create **`create-badass-app`** - a CLI scaffolding tool that generates new @badass sites with:

### 1. CLI Scaffolding Strategy

Use **Bun's native scaffolding** (no external tool needed):

```bash
bunx create-badass-app my-new-site
```

Implementation:

```typescript
// packages/create-badass-app/index.ts
import { spawn } from "bun";
import { parseArgs } from "util";

const args = parseArgs({
  args: Bun.argv,
  options: {
    template: { type: "string", default: "default" },
  },
  allowPositionals: true,
});

const projectName = args.positionals[2]; // bunx create-badass-app <name>
const template = args.values.template;

// Copy template files
await Bun.write(
  `${projectName}/package.json`,
  JSON.stringify({
    name: projectName,
    version: "0.1.0",
    // ... template package.json
  })
);

// Run bun install
spawn(["bun", "install"], { cwd: projectName, stdio: "inherit" });
```

**Why not degit/giget?** Bun's file I/O is fast enough, and we avoid external dependencies. Template lives in `packages/create-badass-app/templates/`.

### 2. Email Capture Strategy

Use **database-backed email list** (no ConvertKit/external service by default):

```typescript
// Database schema
const EmailSubscriberSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  status: z.enum(["pending", "confirmed", "unsubscribed"]),
  confirmedAt: z.coerce.date().nullable(),
  metadata: z.record(z.unknown()).optional(), // UTM params, tags, etc.
  createdAt: z.coerce.date(),
});

// API route
// app/api/subscribe/route.ts
export async function POST(req: Request) {
  const { email } = await req.json();
  
  const subscriber = await db.createEmailSubscriber({
    email,
    status: "pending",
    metadata: { source: "landing-page" },
  });

  // Send confirmation email (optional)
  await sendConfirmationEmail(subscriber);

  return Response.json({ success: true });
}
```

**Adapter pattern** (inspired by course-builder):

```typescript
// packages/core/src/adapters/email-list-adapter.ts
export interface EmailListAdapter {
  subscribe(email: string, metadata?: Record<string, any>): Promise<void>;
  unsubscribe(email: string): Promise<void>;
  getSubscriber(email: string): Promise<EmailSubscriber | null>;
}

// Database implementation (default)
export class DatabaseEmailListAdapter implements EmailListAdapter {
  async subscribe(email: string, metadata?: Record<string, any>) {
    return db.createEmailSubscriber({ email, metadata });
  }
}

// ConvertKit implementation (optional)
export class ConvertKitEmailListAdapter implements EmailListAdapter {
  async subscribe(email: string, metadata?: Record<string, any>) {
    return convertKit.addSubscriber(email);
  }
}
```

**Why database-backed?** Creators own their data. No vendor lock-in. Can migrate to ConvertKit later via adapter swap.

### 3. Content Structure

Use **ContentResource pattern** from ADR-003:

```
src/
└── content/
    ├── posts/
    │   ├── intro-to-react.mdx
    │   ├── advanced-hooks.mdx
    │   └── metadata.ts          # Post-specific config
    └── collections/
        ├── react-basics.ts       # Collection definition
        └── advanced-patterns.ts
```

**Blog posts** are `ContentResource` with `type: "post"`:

```typescript
const PostSchema = ContentResourceSchema.extend({
  type: z.literal("post"),
  fields: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    body: z.string(),
    publishedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
  }),
});
```

**Collections** use `ContentResourceResource` to group posts:

```typescript
// src/content/collections/react-basics.ts
import { createCollection } from "@badass/core";

export const reactBasics = createCollection({
  title: "React Basics",
  slug: "react-basics",
  posts: ["intro-to-react", "jsx-fundamentals", "state-and-props"],
});
```

**Why this structure?** Reuses proven ContentResource model. Collections are first-class, queryable, reorderable.

### 4. Default Stack

**Next.js 16** (App Router, Turbopack, Cache Components):

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@badass/core": "workspace:*",
    "@badass/db": "workspace:*",
    "@badass/ui": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "biome": "^1.9.0",
    "playwright": "^1.48.0"
  }
}
```

**File structure**:

```
my-new-site/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── blog/
│   │   │   ├── page.tsx          # Blog index
│   │   │   └── [slug]/page.tsx   # Post page
│   │   ├── api/
│   │   │   └── subscribe/route.ts
│   │   └── layout.tsx
│   ├── content/
│   │   ├── posts/
│   │   └── collections/
│   └── lib/
│       ├── db.ts
│       └── email.ts
├── public/
├── package.json
├── next.config.ts
└── README.md
```

**Styling**: Tailwind CSS (pre-configured with @badass/ui theme tokens).

**Database**: SQLite via `bun:sqlite` (can swap to Postgres/Turso later).

**Testing**: Playwright for e2e (ADR-006), Vitest for package tests.

## Consequences

### Positive

- **Fast project creation** - `bunx create-badass-app my-site` and you're running in <2 min
- **Consistent structure** - All @badass apps follow the same patterns
- **Own your data** - Email list in your database, not a third-party service
- **Proven patterns** - ContentResource, Collections, Email adapters battle-tested in course-builder
- **Upgrade path** - Template improvements can be cherry-picked into existing projects
- **No vendor lock-in** - Adapter pattern allows swapping email providers later

### Negative

- **Template maintenance burden** - Need to keep template in sync with core package changes
- **Database required** - Even simple landing pages need a DB (mitigated: SQLite is zero-config)
- **Migration complexity** - Existing projects can't auto-upgrade, must manually cherry-pick
- **CLI complexity** - Bun scaffolding is less feature-rich than tools like degit/plop

### Neutral

- **Monorepo-first** - Template assumes workspaces setup, not standalone package
- **Next.js commitment** - Locked into Next.js App Router (not a static site generator)
- **Bun runtime** - Requires Bun, not Node.js

## Alternatives Considered

### Alternative 1: `degit` / `giget`

Use existing scaffolding tools like `degit` or `giget` to clone a template repo.

**Why rejected**: 
- External dependency (degit requires Node, giget is another tool to maintain)
- Bun's native file I/O is fast enough for copying templates
- Want full control over prompts, validation, post-install steps

### Alternative 2: ConvertKit-first email capture

Default to ConvertKit API for email capture instead of database-backed.

**Why rejected**:
- Vendor lock-in from day one
- Creators must have ConvertKit account to use template
- Can't test locally without API keys
- Database adapter pattern allows adding ConvertKit later without breaking changes

### Alternative 3: Separate tables for each content type

Use `posts` table instead of ContentResource pattern.

**Why rejected**:
- Violates ADR-003 decision (ContentResource is the standard)
- Doesn't support collections/relationships without join tables
- Harder to add new content types (workshops, tips, videos)

### Alternative 4: Static site generator (Astro/Eleventy)

Use a static site generator instead of Next.js.

**Why rejected**:
- @badass platform needs dynamic features (auth, purchases, API routes)
- Next.js SSG + ISR provides static speed with dynamic escape hatches
- Course-builder legacy is built on Next.js, reuse knowledge/components

### Alternative 5: `plop` for code generation

Use `plop` or similar code generation tool.

**Why rejected**:
- Plop is for adding files to existing projects, not scaffolding new ones
- Want a `create-*` style CLI for discovery (`bunx create-badass-app`)
- Simpler to implement with Bun's native APIs

## References

- [ADR-003: Content Model](./003-content-model.md) - ContentResource + Collections pattern
- [ADR-001: Auth Architecture](./001-auth-architecture.md) - Hive + Spoke model for multi-app auth
- [ADR-006: Testing Strategy](./006-testing-strategy.md) - Playwright + Vitest setup
- [course-builder adapters](../../legacy/course-builder/packages/core/src/adapters.ts) - Adapter pattern reference
- [create-t3-app](https://create.t3.gg/) - CLI scaffolding inspiration
- [Bun.write documentation](https://bun.sh/docs/api/file-io#writing-files) - Native file I/O APIs
