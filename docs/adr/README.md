# Architecture Decision Records (ADRs)

We use ADRs to document significant architectural decisions. ADRs are immutable once accepted - if a decision changes, write a new ADR that supersedes the old one.

## Why ADRs?

- **Memory**: Decisions get forgotten. ADRs are searchable history.
- **Onboarding**: New contributors understand _why_, not just _what_.
- **Accountability**: Forces explicit reasoning before committing to a path.
- **Reversal**: When revisiting decisions, you have the original context.

## When to Write an ADR

Write an ADR when:

- Choosing between multiple valid approaches
- Making decisions that are hard to reverse
- Establishing patterns that others will follow
- Deviating from common conventions

Don't write an ADR for:

- Obvious choices with no alternatives
- Trivial implementation details
- Temporary workarounds (use code comments)

## ADR Format

```
# ADR-NNN: Title

**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Date**: YYYY-MM-DD
**Authors**: @github-handle

## Context

What is the issue? What forces are at play?

## Decision

What is the change being proposed/accepted?

## Consequences

What are the trade-offs? What becomes easier/harder?

## Alternatives Considered

What other options were evaluated? Why were they rejected?
```

## Index

| ADR                               | Title                                                  | Status   | Date       |
| --------------------------------- | ------------------------------------------------------ | -------- | ---------- |
| [001](./001-auth-architecture.md) | Auth Architecture: Hive + Spoke Model                  | Accepted | 2024-12-18 |
| [002](./002-router-pattern.md)    | Router Pattern: Effect-TS Type-State Builder           | Accepted | 2024-12-18 |
| [003](./003-content-model.md)     | Content Model: ContentResource + Collections           | Accepted | 2024-12-18 |
| [004](./004-tooling-stack.md)     | Tooling Stack: pnpm, Biome, tsgo                        | Accepted | 2024-12-18 |
| [005](./005-monorepo-structure.md)| Monorepo Structure: Turborepo, Workspaces, Legacy Submodule | Accepted | 2024-12-18 |
| [006](./006-testing-strategy.md)  | Testing Strategy: TDD Mandate with Vitest and Playwright | Accepted | 2024-12-18 |
| [007](./007-cicd-pipeline.md)     | CI/CD Pipeline: GitHub Actions, Intelligent Selection  | Accepted | 2024-12-18 |
| [008](./008-app-template.md)      | App Template: create-badass-app CLI Scaffolding       | Accepted | 2024-12-18 |
| [009](./009-local-dev-database.md)| Local Dev Database: Docker Compose + MySQL 8.0        | Accepted | 2024-12-18 |
| [010](./010-ui-component-sync-strategy.md) | UI Component Sync Strategy: shadcn + Base UI + Custom Registry | Proposed | 2026-01-17 |

## Commands

```bash
# Create new ADR (use next available number)
cp docs/adr/_template.md docs/adr/NNN-title.md

# List all ADRs
ls docs/adr/*.md | grep -v template | grep -v README
```
