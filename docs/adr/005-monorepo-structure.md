# ADR-005: Monorepo Structure - Turborepo, Workspaces, Legacy Submodule

**Status**: Accepted
**Date**: 2024-12-18
**Authors**: @joelhooks

## Context

The @badass course platform needs a monorepo structure that:

1. **Supports multiple apps** - wizardshit.ai is first, more creator sites coming
2. **Shares code effectively** - Auth, router, DB adapters used across apps
3. **Enables parallel development** - Multiple teams/agents working simultaneously
4. **Maintains build performance** - Fast CI, local dev iteration cycles
5. **References legacy patterns** - course-builder has proven patterns we want to evolve from

Key constraints:

- **Bun as runtime**: Using Bun workspaces, not npm/pnpm/yarn
- **TypeScript Go**: Fast type checking with `tsgo` instead of `tsc`
- **Fast tooling**: oxlint, biome, Turborepo for speed
- **Effect-TS core**: Shared packages use Effect for composability

The driving decision: How do we structure the monorepo to support rapid iteration while keeping builds fast and code shareable?

## Decision

Adopt a **three-tier workspace structure** with Turborepo orchestration:

### 1. Workspace Layout

```
wizardshit-ai/
├── apps/              # Deployable applications (Next.js sites)
│   └── wizardshit-ai/ # First creator site
├── packages/          # Shared libraries (@badass/*)
│   ├── core/          # Router, schemas, base types
│   └── db/            # Database adapters, schema
├── tooling/           # Development tools
│   ├── gh-actions/    # Reusable GitHub Actions
│   └── test-utils/    # Shared test utilities
└── legacy/            # Git submodule (read-only reference)
    └── course-builder/
```

**Workspaces configured** in `package.json`:

```json
{
  "workspaces": [
    "apps/*",
    "packages/*",
    "tooling/*"
  ]
}
```

### 2. Package Naming Convention

All shared packages use the `@badass/*` namespace:

- `@badass/core` - Router, middleware, procedures
- `@badass/db` - Database adapters, schema utilities

**Why @badass**:
- Memorable brand alignment
- Clear ownership vs third-party deps
- Consistent with creator platform identity

### 3. Turborepo Build Orchestration

Turborepo handles task scheduling, caching, and parallelization via `turbo.json`:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

**Key features enabled**:

- **Task dependency graph**: `^build` means "run dependencies' build first"
- **Smart caching**: Outputs cached locally and remotely (Vercel)
- **Parallel execution**: Independent tasks run concurrently
- **Incremental builds**: Only rebuild changed packages

### 4. Legacy Submodule (course-builder)

The legacy course-builder monorepo is included as a **read-only git submodule**:

```
[submodule "legacy/course-builder"]
  path = legacy/course-builder
  url = https://github.com/badass-courses/course-builder
```

**Purpose**: Reference implementation, not active dependency. Patterns to evolve:

- `packages/adapter-drizzle` → `@badass/db`
- `packages/core` → `@badass/core`
- tRPC procedures → Effect router (ADR-002)
- Auth flows → Hive + Spoke (ADR-001)

**Critical**: Code is NOT imported from `legacy/`. It's documentation.

## Consequences

### Positive

- **Fast builds**: Turborepo caching reduces CI time by 60-80% after first run
- **Type safety**: Shared packages enforce contracts between apps
- **Parallel development**: Multiple agents can work on separate packages simultaneously
- **Clear ownership**: Three-tier structure (apps/packages/tooling) makes responsibilities obvious
- **Package reuse**: `@badass/*` packages can be extracted to npm if needed
- **Legacy reference**: course-builder patterns available without coupling

### Negative

- **Workspace complexity**: Developers need to understand Bun workspaces + Turborepo
- **Dependency hoisting**: Bun hoists deps to root, can hide missing `peerDependencies`
- **Task configuration**: Each new task type needs `turbo.json` entry
- **Submodule maintenance**: `git submodule update` required after clone

### Neutral

- **Turborepo lock-in**: Committed to Turbo for orchestration (alternatives exist but switching is work)
- **Build tool evolution**: May need to adjust as Bun's built-in tools mature
- **Remote caching**: Currently using Vercel, could switch to self-hosted

## Alternatives Considered

### Alternative 1: Flat Structure (No Workspaces)

Put all packages in root with manual dependency management.

**Why rejected**: No automatic linking, manual symlinks break. Bun workspaces provide zero-config local package resolution.

### Alternative 2: Nx Instead of Turborepo

Use Nx for monorepo orchestration.

**Why rejected**: Nx has more features but heavier. Turborepo is simpler, faster for our scale. We don't need Nx's code generation or affected detection (yet).

### Alternative 3: pnpm Workspaces

Use pnpm instead of Bun for workspace management.

**Why rejected**: Bun is our runtime (AGENTS.md mandate). Using pnpm adds another tool. Bun workspaces + Turborepo covers our needs.

### Alternative 4: Import Legacy Code Directly

Import course-builder packages as workspace members instead of submodule.

**Why rejected**: Creates false dependency. We want to evolve patterns, not maintain legacy. Submodule signals "reference only, don't import."

### Alternative 5: Scoped Packages by Domain (@badass/auth, @badass/content)

Organize packages by feature domain instead of technical layer.

**Why rejected**: Too early. We have 2 packages. Wait for 5+ packages before reorganizing by domain. Current structure (core, db) is adequate.

## References

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Bun Workspaces](https://bun.sh/docs/install/workspaces)
- [Monorepo Tools Comparison](https://monorepo.tools/)
- [course-builder monorepo](https://github.com/badass-courses/course-builder) - Legacy reference
- [Vercel Remote Caching](https://vercel.com/docs/monorepos/remote-caching)
