```
                                    ___
                                 .-'   `'.
                                /         \
                                |         ;
                                |         |           ___.--,
                       _.._     |0) ~ (0) |    _.---'`__.-( (_.
                __.--'`_.. '.__.\    '--. \_.-' ,.--'`     `""`
               ( ,.--'`   ',__ /./;   ;, '.__.'`    __
               _`) )  .---.__.' / |   |\   \__..--""  """--.,_
              `---' .'.''-._.-'`_./  /\ '.  \ _.-~~~````~~~-._`-.__.'
                    | |  .' _.-' |  |  \  \  '.               `~---`
                     \ \/ .'     \  \   '. '-._)
                      \/ /        \  \    `=.__`~-.
                      / /\         `) )    / / `"".`\
                , _.-'.'\ \        / /    ( (     / /
                 `--~`   ) )    .-'.'      '.'.  | (
                        (/`    ( (`          ) )  '-;
                         `      '-;         (-'

   ██████╗ ██████╗ ███████╗███╗   ███╗██╗     ██╗███╗   ██╗
  ██╔════╝ ██╔══██╗██╔════╝████╗ ████║██║     ██║████╗  ██║
  ██║  ███╗██████╔╝█████╗  ██╔████╔██║██║     ██║██╔██╗ ██║
  ██║   ██║██╔══██╗██╔══╝  ██║╚██╔╝██║██║     ██║██║╚██╗██║
  ╚██████╔╝██║  ██║███████╗██║ ╚═╝ ██║███████╗██║██║ ╚████║
   ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝

        The @badass course platform - feed it after midnight
```

# GREMLIN

> **Don't expose it to bright light. Don't get it wet. And never, ever feed it after midnight.**

Monorepo for the next-generation badass course platform. Extracted patterns from [course-builder](https://github.com/badass-courses/course-builder), rebuilt from scratch with modern tooling, a Convex-first data direction, and multi-framework frontend support.

---

## Wisdom from the Ancients

> *"To me, legacy code is simply code without tests."*
> — **Michael Feathers**, Working Effectively with Legacy Code

> *"The most important issue in designing classes and other modules is to make them deep, so that they have simple interfaces for the common cases."*
> — **John Ousterhout**, A Philosophy of Software Design

> *"It's not about our product, our company, our brand. It's not about how the user feels about us. It's about how the user feels about himself, in the context of whatever it is our product helps them do."*
> — **Kathy Sierra**, Badass: Making Users Awesome

> *"Deliberate Practice moves skills from B to C (from 'with effort' to 'mastered'). Deliberate Practice fixes the single biggest problem most people have with learning."*
> — **Kathy Sierra**, Badass: Making Users Awesome

---

## Status: Layer 1 Kickoff (Convex + Multi-Framework)

```
┌─────────────────────────────────────────────────────────────────┐
│                      PROJECT ROADMAP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [████████████████████] Layer 0: Foundation            ✅ COMPLETE │
│  [██░░░░░░░░░░░░░░░░░░] Layer 1: Convex + Frameworks   ⏳ IN PROGRESS │
│  [░░░░░░░░░░░░░░░░░░░░] Layer 2: Commerce + Auth       📋 PLANNED │
│  [░░░░░░░░░░░░░░░░░░░░] Layer 3: Content Workflows     📋 PLANNED │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What's Built

**Packages:**
- `@gremlincms/core` - Type-safe router builder, content resource schemas (Zod + Effect)
- `@gremlincms/db` - Provider/adapter database layer (Drizzle today, Convex-first direction)
- `@gremlincms/convex-adapter` - Convex adapter primitives for the db interface
- `@gremlincms/next` - Next.js App Router handler wrapper over `createHttpHandler`
- `@gremlincms/tanstack` - TanStack Start request handler wrapper over `createHttpHandler`
- `@gremlincms/cli` - Agent-first CLI for auth, config, RPC calls, content operations, and seeding

**Infrastructure:**
- CI/CD pipeline with intelligent E2E testing
- Turborepo remote caching
- Playwright sharding + change detection
- ADR (Architecture Decision Records) system
- Changesets for versioning
- **159 unit tests + 2 E2E tests passing**

**Key Decisions (16 ADRs):**
- [ADR-001](docs/adr/001-auth-architecture.md): Hive + Spoke auth model
- [ADR-002](docs/adr/002-router-pattern.md): Effect-TS type-state router
- [ADR-003](docs/adr/003-content-model.md): ContentResource + Collections
- [ADR-004](docs/adr/004-tooling-stack.md): pnpm, Biome, tsgo
- [ADR-005](docs/adr/005-monorepo-structure.md): Turborepo + Workspaces
- [ADR-006](docs/adr/006-testing-strategy.md): TDD + Vitest + Playwright
- [ADR-007](docs/adr/007-cicd-pipeline.md): GitHub Actions + Intelligent E2E
- [ADR-008](docs/adr/008-app-template.md): create-badass-app CLI
- [ADR-009](docs/adr/009-local-dev-database.md): Docker Compose + MySQL
- [ADR-010](docs/adr/010-convex-first-provider-adapter-pattern.md): Convex-first database with provider/adapter pattern
- [ADR-011](docs/adr/011-multi-framework-frontend-support.md): Multi-framework frontend support
- [ADR-012](docs/adr/012-reference-site-architecture.md): Reference site architecture (wizardshit-ai + gremlin-cms)
- [ADR-013](docs/adr/013-domain-scoped-adapter-interfaces.md): Domain-scoped adapter interfaces
- [ADR-014](docs/adr/014-core-handler-hybrid-routing.md): Core handler hybrid routing model
- [ADR-015](docs/adr/015-architecture-reconciliation.md): Architecture reconciliation baseline
- [ADR-016](docs/adr/016-gremlin-cli.md): Gremlin CLI for agent-first operations

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Run development
pnpm dev

# Run tests
pnpm test:run

# Run E2E tests
pnpm e2e
```

---

## Architecture

```
gremlin/
├── apps/
│   ├── wizardshit-ai/        # Next.js 16 reference site (Turbopack + cache components)
│   └── gremlin-cms/          # TanStack Start reference site (parity app)
│
├── packages/
│   ├── core/                 # Router, schemas, types
│   │   ├── router/           # Type-safe procedure builder
│   │   └── schemas/          # Content resource Zod schemas
│   │
│   ├── convex-adapter/       # Convex adapter package
│   ├── next/                 # Next.js framework wrapper package
│   ├── tanstack/             # TanStack Start framework wrapper package
│   ├── cli/                  # Gremlin CLI package
│   │
│   └── db/                   # Database layer
│       ├── adapter/          # Provider adapters (Drizzle + Convex strategy)
│       ├── schema/           # Drizzle table definitions
│       └── utils/            # Position ordering, etc.
│
├── tooling/
│   ├── gh-actions/           # Reusable GitHub Actions
│   └── test-utils/           # Shared test utilities
│
├── docs/
│   └── adr/                  # Architecture Decision Records
│
└── legacy/
    └── course-builder/       # Reference implementation (git submodule)
```

---

## CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                         CI WORKFLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  On Push/PR:                                                    │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  Build  │  │Typecheck│  │  Lint   │  │ Format  │  parallel  │
│  └────┬────┘  └─────────┘  └─────────┘  └─────────┘            │
│       │                                                         │
│       ↓                                                         │
│  ┌─────────┐                                                    │
│  │  Test   │  159 unit tests                                    │
│  └─────────┘                                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  E2E (when apps/ or packages/ change):                          │
│                                                                 │
│  ┌────────────────────────────────────┐                         │
│  │  Playwright Shards (2x parallel)   │                         │
│  │  + --only-changed on PRs           │                         │
│  │  + Merged HTML reports             │                         │
│  └────────────────────────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Enable Remote Caching

Add these to your GitHub repo settings:

| Name | Type | Where to Get |
|------|------|--------------|
| `TURBO_TOKEN` | Secret | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `TURBO_TEAM` | Variable | Your Vercel team slug |

---

## Scripts

```bash
# Development
pnpm dev                 # Start all apps in dev mode
pnpm build               # Build all packages and apps

# Testing
pnpm test                # Run unit tests (watch mode)
pnpm test:run            # Run unit tests once
pnpm test:coverage       # Run with coverage
pnpm e2e                 # Run E2E tests

# Code Quality
pnpm lint                # Run linters
pnpm format              # Format code
pnpm format:check        # Check formatting (CI)
pnpm typecheck           # Type check with tsgo

# Releases
pnpm changeset           # Create a changeset
pnpm version             # Version packages
pnpm release             # Publish to npm
```

---

## Stack

| Tool | Purpose |
|------|---------|
| **pnpm** | Runtime, package manager, test runner |
| **TypeScript Go** | Type checking (faster than tsc) |
| **Turborepo** | Build orchestration + remote caching |
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |
| **Biome** | Formatting + linting |
| **Effect** | Typed errors, services, schemas |
| **Convex** | Primary database/runtime for initial sites |
| **Drizzle** | SQL adapter for portability (Postgres/MySQL) |
| **Next.js 16** | Reference app framework (App Router + Turbopack) |
| **TanStack Start** | Reference app framework (Router + Query + Server Functions) |

---

## Philosophy

> *"The 4 Rules of Simple Design: Tests Pass, Reveals Intention, No Duplication, Fewest Elements."*
> — **Corey Haines** (via Kent Beck)

### Core Principles

- **TDD or GTFO** — Red → Green → Refactor, no exceptions
- **ADRs for decisions** — Document before implementing
- **Deep modules** — Simple interfaces hiding complex implementations
- **Colocation** — Keep related code together
- **Server first** — Client when necessary
- **Parse, don't validate** — Make impossible states impossible

### What We Believe

```
Beautiful is better than ugly.
Explicit is better than implicit.
Simple is better than complex.
Flat is better than nested.
Readability counts.
Practicality beats purity.
If the implementation is hard to explain, it's a bad idea.
```

---

## What's Next

**Layer 1: Convex + Multi-Framework Parity**
- Implement Convex adapter in `@gremlincms/db` using `ContentResourceAdapter` as the stable contract ([ADR-010](docs/adr/010-convex-first-provider-adapter-pattern.md))
- Build framework adapters: `@gremlincms/next` + `@gremlincms/tanstack-start` over shared `@gremlincms/core` procedures ([ADR-011](docs/adr/011-multi-framework-frontend-support.md))
- Develop parity between `apps/wizardshit-ai` (Next.js) and `apps/gremlin-cms` (TanStack Start) as reference sites ([ADR-012](docs/adr/012-reference-site-architecture.md))
- Continue auth infrastructure (`@gremlincms/auth`, hive+spoke model) on top of shared adapters

---

## Contributing

1. Check [docs/adr/](docs/adr/) for architectural context
2. Write a failing test first
3. Make it pass
4. Create a changeset if it affects package consumers

---

```
        ,     ,
       (\____/)
        (_oo_)
          (O)
        __||__    \)
     []/______\[] /
     / \______/ \/
    /    /__\
   (\   /____\

   "With great power comes
    great responsibility...
    to write tests first."
```

---

<sub>*"Users of a module need only understand the abstraction provided by its interface."* — Ousterhout</sub>
