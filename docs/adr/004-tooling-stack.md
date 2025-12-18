# ADR-004: Tooling Stack - Bun, Biome, tsgo over Traditional Tools

**Status**: Accepted
**Date**: 2024-12-18
**Authors**: @joelhooks

## Context

JavaScript/TypeScript tooling has historically been fragmented and slow. Traditional stacks typically combine:

- **Node.js** (runtime) + **npm/yarn/pnpm** (package manager) + **webpack/esbuild** (bundler)
- **Prettier** (formatter) + **ESLint** (linter) + **tsc** (type checker)
- Multiple configuration files, dependency conflicts, and slow feedback loops

For the wizardshit.ai monorepo, we need:

1. **Fast development feedback** - instant dev server, quick type checks, rapid test runs
2. **Unified tooling** - fewer tools, fewer configs, less complexity
3. **Production-ready** - reliable enough for Vercel's education platform
4. **Monorepo-friendly** - works well with Turborepo and workspace dependencies

The traditional Node.js + npm + Prettier + ESLint + tsc stack is functional but slow and fragmented. Each tool has its own config, runtime, and mental model. Developer experience suffers from:

- Slow `npm install` (even with caching)
- Slow `tsc --build` across workspaces
- ESLint + Prettier conflicts requiring coordination
- Bundler complexity (webpack configs, esbuild plugins)

We're establishing this stack for a greenfield monorepo with zero migration cost. This is the time to optimize for speed and simplicity.

## Decision

Adopt a **modern, unified, performance-first tooling stack**:

### Runtime + Package Manager: **Bun**

Replace Node.js, npm, yarn, pnpm, webpack, and esbuild with **Bun** (v1.x).

- **Runtime**: `bun <file>` instead of `node <file>` or `ts-node <file>`
- **Package manager**: `bun install` instead of `npm/yarn/pnpm install`
- **Bundler**: `bun build` instead of webpack/esbuild
- **Test runner**: `bun test` or `vitest` (via Bun runtime)
- **Script runner**: `bun run <script>` instead of `npm run`

Bun is a drop-in Node.js replacement with built-in TypeScript, JSX, and .env support. No dotenv, no ts-node, no separate bundler.

### Formatter + Linter: **Biome**

Replace Prettier + ESLint with **Biome** (v1.x).

- **Formatting**: `biome format` (Prettier-compatible output)
- **Linting**: `biome lint` (ESLint rule subset + performance rules)
- **Single config**: `biome.json` (no .prettierrc + .eslintrc conflicts)

Biome is written in Rust, runs 10-20x faster than Prettier + ESLint, and uses a single AST pass for both formatting and linting.

### Type Checker: **tsgo (TypeScript Go)**

Replace `tsc` with **tsgo** for type checking.

- Faster incremental builds (Go-based parallelization)
- Drop-in `tsc` replacement: `tsgo --build`
- Better monorepo performance

### Fast Linting: **oxlint**

Use **oxlint** (Rust-based) for ultra-fast linting during development.

- Runs in <100ms on most codebases
- Subset of ESLint rules (catches common errors)
- Complement to Biome for speed-critical feedback (e.g., pre-commit hooks)

### Next.js Dev Server: **Turbopack**

Use `next dev --turbopack` instead of webpack-based dev server.

- Faster HMR (hot module replacement)
- Incremental bundling (only recompile changed modules)
- Built into Next.js 14+, production-ready in Next.js 16+

### Rationale

**Why now?**

- **Bun** is stable (v1.x), used in production by Vercel and others
- **Biome** reached v1.0, covers 95%+ of Prettier + ESLint use cases
- **tsgo** is mature enough for monorepo type checking
- **Turbopack** ships with Next.js, no extra config
- **Greenfield monorepo** - no migration cost, only upside

**Why together?**

These tools share a philosophy: **rewrite critical tooling in faster languages** (Rust, Go, Zig) and **unify fragmented workflows**. The result is fewer moving parts, faster feedback, and simpler mental models.

## Consequences

### Positive

- **Faster development feedback**: Bun install ~10x faster, oxlint ~20x faster, Biome ~10x faster than Prettier+ESLint
- **Fewer tools to learn**: Bun replaces 4+ tools (Node, npm, bundler, ts-node), Biome replaces 2 (Prettier, ESLint)
- **Fewer configs**: `biome.json` instead of `.prettierrc` + `.eslintrc` + `.prettierignore` + `.eslintignore`
- **Simpler onboarding**: "Install Bun, run `bun install`, you're done" vs. Node + nvm + npm vs. yarn vs. pnpm debates
- **Built-in features**: Bun auto-loads `.env`, supports JSX/TypeScript natively, has built-in test runner
- **Monorepo performance**: tsgo + Turborepo scale better than tsc across workspaces
- **Production alignment**: Vercel uses Bun and Turbopack internally, reducing "works on my machine" gaps

### Negative

- **Ecosystem maturity**: Bun is younger than Node.js (some edge cases, fewer Stack Overflow answers)
- **Biome coverage**: Doesn't support every ESLint plugin (e.g., custom domain-specific linters)
- **Team familiarity**: Team must learn Bun APIs (`Bun.serve`, `Bun.file`, etc.) instead of Node equivalents
- **CI/CD adjustments**: GitHub Actions need `oven-sh/setup-bun` instead of `actions/setup-node`
- **Fallback complexity**: If we hit Bun bugs, falling back to Node requires dual configs

### Neutral

- **Not dogmatic**: Can still use Node for specific packages if Bun fails (use `package.json` `engines` field)
- **Gradual adoption**: Can run Node and Bun side-by-side during exploration
- **Biome + oxlint overlap**: Running both adds complexity, but oxlint is optional (speed vs. coverage trade-off)

## Alternatives Considered

### Alternative 1: Traditional Stack (Node.js + npm + Prettier + ESLint + tsc)

**Description**: Stick with the proven, widely-adopted tooling.

- Node.js 20 LTS + npm workspaces
- Prettier + ESLint with shared configs
- tsc for type checking

**Why rejected**:

- **Speed**: npm is 5-10x slower than Bun for installs, tsc is slower than tsgo, Prettier+ESLint take 2-5s on medium codebases
- **Complexity**: Managing Prettier + ESLint conflicts, dual configs, plugin ecosystems
- **Missed opportunity**: Greenfield project, no migration cost to try modern tools
- **Developer experience**: Slow feedback loops hurt iteration speed

### Alternative 2: pnpm + swc + ESLint

**Description**: Faster Node.js stack using modern tools.

- pnpm (faster package manager, good monorepo support)
- swc (Rust-based transpiler, faster than Babel)
- ESLint (linting) + Prettier (formatting)

**Why rejected**:

- **Still fragmented**: pnpm + swc + ESLint + Prettier = 4 tools with 4 configs
- **Not fast enough**: pnpm is faster than npm but slower than Bun, swc doesn't cover bundling
- **Half-measure**: Gains speed but keeps complexity (Prettier+ESLint conflicts remain)
- **Bun subsumes swc**: Bun's bundler already uses swc-style transforms, no need for separate tool

### Alternative 3: Deno

**Description**: Use Deno as runtime + tooling (built-in formatter, linter, test runner, bundler).

**Why rejected**:

- **Ecosystem compatibility**: Deno's npm compatibility is improving but still rougher than Bun's
- **Next.js support**: Next.js officially supports Bun, Deno support is experimental
- **Vercel alignment**: Vercel uses Bun internally, not Deno
- **Monorepo tooling**: Deno workspaces are less mature than Bun + Turborepo

### Alternative 4: Keep tsc, only adopt Bun + Biome

**Description**: Adopt Bun for runtime/package management and Biome for formatting/linting, but keep `tsc` for type checking.

**Why rejected**:

- **Incremental gains**: tsc is the slowest part of the build in large monorepos
- **tsgo is stable**: Mature enough for production use, worth the experiment
- **Consistency**: If we're already adopting faster tools (Bun, Biome), why not complete the set?
- **Fallback option**: Can revert to tsc easily if tsgo fails (just change command in package.json)

## References

- [Bun Documentation](https://bun.sh/docs)
- [Biome Documentation](https://biomejs.dev/)
- [TypeScript Go (tsgo) GitHub](https://github.com/dsherret/ts-go)
- [oxlint Documentation](https://oxc-project.github.io/)
- [Next.js Turbopack Documentation](https://nextjs.org/docs/architecture/turbopack)
- [AGENTS.md Stack Section (lines 99-141)](../AGENTS.md)
