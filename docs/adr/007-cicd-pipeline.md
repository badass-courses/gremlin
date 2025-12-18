# ADR-007: CI/CD Pipeline - GitHub Actions with Intelligent Test Selection

**Status**: Accepted
**Date**: 2024-12-18
**Authors**: @joelhooks

## Context

A monorepo with multiple apps and packages needs a CI/CD pipeline that:

1. **Runs fast** - PR feedback in <5 minutes, not 20+ minutes
2. **Scales horizontally** - More tests = more parallel jobs, not longer CI
3. **Wastes minimal resources** - Don't run E2E when only docs changed
4. **Leverages remote caching** - Don't rebuild unchanged packages
5. **Provides clear feedback** - What failed, where, with visual reports

Key constraints:

- **Bun monorepo** with Turbo orchestration
- **Multiple apps** (wizardshit-ai, future apps)
- **Shared packages** requiring build step before dependent jobs
- **E2E tests** are slow (~10min for full suite)
- **GitHub Actions** budget - minimize CI minutes

The driving use case: Developer pushes a PR touching only one component. They need fast feedback on affected tests, not a full 20-minute CI run.

## Decision

Implement a **layered CI/CD pipeline** with intelligent test selection:

### Layer 1: Parallel Quality Gates (No Build Dependency)

Jobs that don't need build artifacts run immediately in parallel:

- **Lint** (oxlint) - 10 min timeout
- **Format** (biome check) - 5 min timeout

### Layer 2: Build + Dependent Jobs

Jobs requiring built packages run after build:

- **Build** - packages only (`--filter="./packages/*"`) - 15 min timeout
- **Typecheck** - needs build, 10 min timeout
- **Test** - unit tests for packages - 15 min timeout

### Layer 3: E2E with Sharding + Change Detection

**Change detection** (dorny/paths-filter):
- Only trigger E2E if `apps/**` or `packages/**` changed
- Skip E2E entirely for docs/config changes

**Sharding strategy**:
- 2 parallel shards (`--shard=1/2`, `--shard=2/2`)
- Matrix strategy with `fail-fast: false` (see all failures)
- Blob reports merged into single HTML artifact

**Fast feedback path** (PRs only):
- `--only-changed` job runs changed tests only
- 15 min timeout vs 30 min for full E2E
- Continues on error (advisory, not blocking)

### Remote Caching (Turbo)

```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

- Vercel-hosted Turbo remote cache
- Shared across all jobs and PRs
- Actions cache for `.turbo` directory as fallback

### Concurrency Control

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```

- Cancel in-progress CI for new PR pushes (fast iteration)
- Never cancel main branch (preserve cache artifacts)

## Consequences

### Positive

- **Fast PR feedback**: Changed tests run in <5 min, full suite in ~10 min (sharded)
- **Cost efficient**: Change detection skips expensive E2E when unnecessary
- **Horizontal scaling**: Add more shards as test suite grows
- **Clear reporting**: Merged HTML reports with screenshots/videos
- **Remote caching**: Build once, use everywhere (local + CI)
- **Fail visibility**: `fail-fast: false` shows ALL failures, not just first

### Negative

- **Complexity**: 3 workflow jobs + change detection + sharding = mental overhead
- **Artifact coordination**: Upload/download dance for build artifacts and blob reports
- **Cache invalidation**: Turbo cache misses mean slower CI (rare but annoying)
- **Shard imbalance**: If tests aren't evenly distributed, one shard blocks merge
- **Cost of sharding**: 2x E2E job minutes (acceptable tradeoff for speed)

### Neutral

- **GitHub Actions lock-in**: Could migrate to other CI, but low priority
- **Maintenance burden**: Workflow files are YAML, easy to break with typos
- **Playwright-specific**: Sharding and blob reports are Playwright features

## Alternatives Considered

### Alternative 1: Jenkins/CircleCI

Self-hosted or commercial CI with more advanced parallelization.

**Why rejected**: GitHub Actions is "close enough", lower ops burden. Turbo caching solves most perf issues.

### Alternative 2: No Sharding, Sequential E2E

Run E2E tests sequentially on single runner.

**Why rejected**: 20+ minute CI runs kill developer flow. Unacceptable for PR feedback loop.

### Alternative 3: Buildkite/Earthly

Advanced caching and parallelization platforms.

**Why rejected**: Overkill for current scale. GitHub Actions + Turbo is 80/20 solution.

### Alternative 4: Always Run Full Suite

No change detection, every PR runs everything.

**Why rejected**: Wasteful. Docs changes don't need E2E. Budget-conscious CI.

### Alternative 5: Vercel Deployment Previews Only

Skip CI, rely on Vercel's deployment checks.

**Why rejected**: No control over test execution. Vercel doesn't run Playwright. Need pre-merge validation.

## References

- [GitHub Actions Workflow](.github/workflows/ci.yaml)
- [E2E Workflow](.github/workflows/e2e.yaml)
- [Turbo Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Playwright Sharding](https://playwright.dev/docs/test-sharding)
- [dorny/paths-filter](https://github.com/dorny/paths-filter) - Change detection
- [Playwright --only-changed](https://playwright.dev/docs/test-cli#reference) - Fast PR feedback
