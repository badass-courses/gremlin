# ADR-004: Tooling Stack - pnpm, Biome, tsgo over Traditional Tools

**Status**: Accepted (updated 2026-01)
**Date**: 2024-12-18 (revised 2026-01-30)
**Authors**: @joelhooks

## Context

JavaScript/TypeScript tooling has historically been fragmented and slow. Traditional stacks typically combine:

- **Node.js** (runtime) + **npm/yarn** (package manager) + **webpack/esbuild** (bundler)
- **Prettier** (formatter) + **ESLint** (linter) + **tsc** (type checker)
- Multiple configuration files, dependency conflicts, and slow feedback loops

For the wizardshit.ai monorepo, we need:

1. **Fast development feedback** - instant dev server, quick type checks, rapid test runs
2. **Unified tooling** - fewer tools, fewer configs, less complexity
3. **Production-ready** - reliable enough for Vercel's education platform
4. **Monorepo-friendly** - works well with Turborepo and workspace dependencies

## Decision

Adopt a **modern, unified, performance-first tooling stack**:

### Package Manager: **pnpm**

Use **pnpm** (v9.x) as the package manager.

- **Package manager**: `pnpm install` for fast, disk-efficient installs
- **Script runner**: `pnpm run <script>` or `pnpm <script>` for npm scripts
- **Workspace support**: Native monorepo support with `pnpm-workspace.yaml`

pnpm is faster than npm/yarn, uses hard links to save disk space, and has excellent monorepo support.

### Formatter + Linter: **Biome**

Replace Prettier + ESLint with **Biome** (v2.x).

- **Formatting**: `biome format` (Prettier-compatible output)
- **Linting**: `biome lint` (ESLint rule subset + performance rules)
- **Single config**: `biome.json` (no .prettierrc + .eslintrc conflicts)

Biome is written in Rust, runs 10-20x faster than Prettier + ESLint, and uses a single AST pass for both formatting and linting.

### Type Checker: **tsgo (TypeScript Go)**

Use **tsgo** for type checking.

- Faster incremental builds (Go-based parallelization)
- Drop-in `tsc` replacement: `tsgo --noEmit`
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

**Why pnpm?**

- **Speed**: 2-3x faster than npm for installs
- **Disk efficiency**: Hard links mean packages aren't duplicated
- **Strict by default**: Prevents phantom dependencies
- **Excellent monorepo support**: First-class workspace support
- **Industry standard**: Used by Vue, Vite, and many other major projects

**Why these tools together?**

These tools share a philosophy: **rewrite critical tooling in faster languages** (Rust, Go) and **unify fragmented workflows**. The result is fewer moving parts, faster feedback, and simpler mental models.

## Consequences

### Positive

- **Faster development feedback**: pnpm install ~2-3x faster than npm, oxlint ~20x faster, Biome ~10x faster than Prettier+ESLint
- **Fewer configs**: `biome.json` instead of `.prettierrc` + `.eslintrc` + `.prettierignore` + `.eslintignore`
- **Disk efficiency**: pnpm's hard links save significant disk space in monorepos
- **Strict dependencies**: pnpm prevents accessing undeclared dependencies
- **Monorepo performance**: tsgo + Turborepo scale better than tsc across workspaces
- **Production alignment**: Standard Node.js runtime, widely supported

### Negative

- **Team familiarity**: pnpm has some different behaviors than npm/yarn
- **Biome coverage**: Doesn't support every ESLint plugin (e.g., custom domain-specific linters)
- **CI caching**: Need to cache pnpm store correctly

### Neutral

- **Not dogmatic**: Can still use specific npm packages if needed
- **Biome + oxlint overlap**: Running both adds complexity, but oxlint is optional (speed vs. coverage trade-off)

## References

- [pnpm Documentation](https://pnpm.io/)
- [Biome Documentation](https://biomejs.dev/)
- [TypeScript Go (tsgo) GitHub](https://github.com/ATypescriptEnjoyer/tsgo)
- [oxlint Documentation](https://oxc-project.github.io/)
- [Next.js Turbopack Documentation](https://nextjs.org/docs/architecture/turbopack)
