# AGENTS.md - wizardshit.ai

> **📖 README COMMANDMENT (NON-NEGOTIABLE)**
>
> **Keep README.md current. It's the front door.**
>
> Update `README.md` when:
>
> - Adding new packages, apps, or major features
> - Creating new ADRs (add to "Key Decisions" list)
> - Changing scripts, stack, or architecture
> - Completing roadmap milestones
>
> **The README is marketing.** New contributors read it first. Stale READMEs signal abandoned projects.

---

> **📐 ADR COMMANDMENT (NON-NEGOTIABLE)**
>
> **Document architectural decisions BEFORE implementing.**
>
> Write an ADR (`docs/adr/NNN-title.md`) when:
>
> - Choosing between multiple valid approaches
> - Making decisions that are hard to reverse
> - Establishing patterns others will follow
>
> ```bash
> cp docs/adr/_template.md docs/adr/NNN-title.md
> ```
>
> **ADRs are immutable.** To change a decision, write a new ADR that supersedes.
>
> **Index**: `docs/adr/README.md` | **Template**: `docs/adr/_template.md`

---

> **🔴 TDD COMMANDMENT (NON-NEGOTIABLE)**
>
> ```
> RED  →  GREEN  →  REFACTOR
> ```
>
> **Every feature. Every bug fix. No exceptions.**
>
> 1. **RED**: Write a failing test first. If it passes, your test is wrong.
> 2. **GREEN**: Minimum code to pass. Hardcode if needed. Just make it green.
> 3. **REFACTOR**: Clean up while green. Run tests after every change.
>
> **Bug fixes**: Write a test that reproduces the bug FIRST. Then fix it.
>
> **Existing code**: Write characterization tests to document actual behavior before changing.
>
> **Testing Stack**:
>
> - **Vitest** + `@effect/vitest` for packages (unit/integration)
> - **Playwright** for apps (e2e)
> - `expectTypeOf` for type-level assertions
>
> **Run tests**: `cd packages/<pkg> && pnpm vitest run`
>
> **Lore**: `@knowledge/tdd-patterns.md` | `skills_use(name="testing-patterns")`

---

> **⚠️ CRITICAL: DEPENDENCY INSTALLATION**
>
> **NEVER modify package.json directly to add dependencies.**
>
> Always use CLI commands with `--cwd` for workspace-specific installs:
>
> ```bash
> # Install to specific workspace
> pnpm add <package> --cwd apps/wizardshit-ai
> pnpm add -d <package> --cwd apps/wizardshit-ai
>
> # Install to root (shared tooling only)
> pnpm add -d <package>
> ```
>
> The `--filter` flag is BROKEN and installs to root. DO NOT USE IT.

---

> **📦 CHANGESETS: Version Management**
>
> Use changesets for all package changes that affect consumers.
>
> ```bash
> # Add a changeset (interactive)
> pnpm changeset
>
> # Version packages (CI usually does this)
> pnpm version
>
> # Publish to npm (CI usually does this)
> pnpm release
> ```
>
> **When to add a changeset:**
>
> - New features (minor)
> - Bug fixes (patch)
> - Breaking changes (major)
> - API changes in `packages/*`
>
> **Skip changesets for:**
>
> - Internal refactors with no API changes
> - Documentation updates
> - Test-only changes
> - App changes (`apps/*` are ignored)

## Stack

- **pnpm**: Runtime and package manager (not Node.js, npm, pnpm, or yarn)
- **TypeScript Go** (`tsgo`): Use instead of `tsc` for type checking
- **oxlint**: Fast linter (use instead of eslint for speed)
- **biome**: Formatter (use instead of prettier)
- **Turbopack**: Use with Next.js dev (`--turbopack` flag)
- **Turborepo**: Build orchestration

## Monorepo Structure

```
wizardshit.ai/
├── apps/
│   └── wizardshit-ai/     # Next.js app
├── packages/
│   └── (shared packages)
├── legacy/                 # course-builder reference
└── ...
```

## pnpm: Package Manager

- Use `pnpm install` instead of `npm install` or `yarn install`
- Use `pnpm run <script>` or `pnpm <script>` for npm scripts
- Use `pnpm exec <package> <command>` instead of `npx <package> <command>`
- Use `pnpm add <pkg>` to install dependencies — **never edit package.json by hand**
- Use `pnpm exec tsx <file>` to run TypeScript files

## Testing

**Stack**: Vitest + `@effect/vitest` for Effect code, Playwright for e2e.

```bash
# Run all package tests
cd packages/core && pnpm vitest run
cd packages/db && pnpm vitest run

# Watch mode
pnpm vitest
```

```ts
// Basic test
import { describe, test, expect, expectTypeOf } from "vitest";

describe("feature", () => {
  test("does the thing", () => {
    expect(doThing()).toBe(expected);
  });
});

// Type-level test
test("infers correct type", () => {
  expectTypeOf(myFunction).returns.toEqualTypeOf<string>();
});

// Effect test (use @effect/vitest)
import { it } from "@effect/vitest";
import * as Effect from "effect/Effect";

it.effect("runs effect", () =>
  Effect.gen(function* () {
    const result = yield* myEffect;
    expect(result).toBe(expected);
  }),
);
```

**Patterns** (from `@knowledge/tdd-patterns.md`):

- **Characterization tests**: Document what code actually does before changing it
- **Test behavior, not implementation**: Ask "if I refactor, should this test break?"
- **One assertion per test**: Clear failure messages
- **Fakes over mocks**: More realistic, less brittle
- **Arrange-Act-Assert**: Structure every test the same way

## Frontend

- **wizardshit-ai**: Next.js 16 (App Router, Turbopack, Cache Components)
- **gremlin-cms**: TanStack Start (TanStack Router, Vite, Nitro)
- Both use Tailwind CSS for styling

