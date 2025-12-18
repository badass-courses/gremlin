# ADR-006: Testing Strategy - TDD Mandate with Vitest and Playwright

**Status**: Accepted
**Date**: 2024-12-18
**Authors**: @joelhooks

## Context

Quality software requires rigorous testing. The @badass platform is building on Effect-TS for type-safe functional programming, and needs a testing strategy that:

1. **Enforces TDD discipline**: Every feature and bug fix must be test-driven
2. **Works seamlessly with Effect-TS**: Tests should be Effect-aware, not fight the framework
3. **Provides fast feedback**: Sub-second unit test runs, rapid iteration cycles
4. **Covers all layers**: Unit, integration, and E2E testing with appropriate tools
5. **Prevents legacy code creation**: Michael Feathers' definition rings true - "legacy code is code without tests"

Current state (as of 2024-12-18):
- 159 unit tests passing across packages
- 2 E2E tests in apps/wizardshit-ai
- Effect-TS throughout core business logic
- Monorepo structure with shared packages

The problem: Without a mandated testing strategy, developers (human and AI) will skip tests, create legacy code from day one, and accumulate technical debt that compounds.

## Decision

### TDD as Non-Negotiable Doctrine

**RED → GREEN → REFACTOR** is the only accepted workflow. No exceptions.

1. **RED**: Write a failing test first. If it passes immediately, the test is wrong.
2. **GREEN**: Write minimum code to pass. Hardcode values if needed. Just make it green.
3. **REFACTOR**: Clean up while tests stay green. Run tests after every change.

**Bug fixes**: Write a test that reproduces the bug FIRST, then fix it. This prevents regression forever.

**Existing code changes**: Write characterization tests to document actual behavior before modifying anything.

### Testing Stack

| Layer            | Tool                | Purpose                              |
| ---------------- | ------------------- | ------------------------------------ |
| Unit/Integration | Vitest              | Fast, ESM-native, Bun-compatible     |
| Effect Code      | `@effect/vitest`    | Effect-aware test helpers            |
| E2E              | Playwright          | Browser automation with parallelism  |
| Type-level       | `expectTypeOf`      | Compile-time type assertions         |

### Tool Rationale

**Vitest**:
- Native ESM support (works with Bun runtime)
- Effect-TS compatible
- Fast watch mode with smart re-runs
- Compatible with Vitest plugin ecosystem

**@effect/vitest**:
- `it.effect()` - run Effect programs in tests
- `it.scoped()` - test with scoped resources
- `it.live()` - test with live services
- Handles Effect errors properly (no unhandled promise rejections)

**Playwright**:
- Cross-browser testing (Chromium, Firefox, WebKit)
- Parallel execution with sharding
- Built-in retry logic for flaky tests
- Trace viewer for debugging failures

**expectTypeOf**:
- Type-level assertions catch API contract changes
- Ensures generic inference works as expected
- Documents type requirements in tests

### Testing Patterns

From Michael Feathers' "Working Effectively with Legacy Code":

- **Characterization tests**: Document what code actually does (not what you wish it did)
- **Seams**: Identify points where behavior can be altered for testing
- **Test behavior, not implementation**: Ask "if I refactor, should this test break?"

From Kent Beck's "4 Rules of Simple Design":

1. Tests pass (green bar is non-negotiable)
2. Reveals intention (tests are documentation)
3. No duplication (DRY applies to tests too)
4. Fewest elements (minimize test setup complexity)

Additional patterns:

- **One assertion per test**: Clear failure messages, pinpoint issues fast
- **Fakes over mocks**: More realistic, less brittle, easier to maintain
- **Arrange-Act-Assert**: Consistent structure - setup, execute, verify

### Run Commands

```bash
# Run all package tests
cd packages/core && bun vitest run
cd packages/db && bun vitest run

# Watch mode (auto-rerun on changes)
bun vitest

# E2E tests
cd apps/wizardshit-ai && bun playwright test

# Type checking (not testing, but related)
bunx tsgo --noEmit
```

### Example Test Structure

```ts
// Basic unit test
import { describe, test, expect, expectTypeOf } from "vitest";

describe("UserService", () => {
  test("creates user with email", () => {
    // Arrange
    const email = "user@example.com";
    
    // Act
    const user = createUser({ email });
    
    // Assert
    expect(user.email).toBe(email);
  });
});

// Type-level test
test("infers User type from schema", () => {
  expectTypeOf(UserSchema).returns.toEqualTypeOf<User>();
});

// Effect test
import { it } from "@effect/vitest";
import * as Effect from "effect/Effect";

it.effect("fetches user by id", () =>
  Effect.gen(function* () {
    const user = yield* UserService.getById("user-123");
    expect(user.id).toBe("user-123");
  }),
);
```

## Consequences

### Positive

- **Zero legacy code from day one**: Every line of production code has a test
- **Regression prevention**: Bug fixes include tests that prevent recurrence
- **Living documentation**: Tests document actual behavior, always up-to-date
- **Refactoring confidence**: Green tests mean safe refactors
- **Effect-TS integration**: `@effect/vitest` makes testing Effect code natural
- **Fast feedback loops**: Vitest + Bun = sub-second test runs
- **Type safety**: `expectTypeOf` catches API contract changes at compile time
- **AI compatibility**: Clear patterns for AI agents to follow (TDD is explicit)

### Negative

- **Upfront time cost**: Writing tests first feels slower initially (pays off long-term)
- **Learning curve**: Effect-aware testing requires understanding Effect-TS execution model
- **Discipline required**: TDD mandate must be enforced via code review and CI gates
- **Test maintenance**: Tests are code - they need refactoring too

### Neutral

- **Test count will grow significantly**: 159 tests → thousands as codebase scales
- **CI time increases**: More tests = longer CI runs (mitigated by parallelization)
- **E2E tests are slower**: Playwright tests take seconds/minutes, not milliseconds

## Alternatives Considered

### Alternative 1: Jest + Testing Library

**Description**: Industry-standard combo for React/Node.js testing.

**Why rejected**: 
- Jest has poor ESM support (still experimental as of 2024)
- Doesn't work well with Bun runtime (compatibility issues)
- Slower than Vitest for watch mode
- No native Effect-TS support

### Alternative 2: "Test Later" / Optional TDD

**Description**: Write code first, add tests when time permits or before merging.

**Why rejected**:
- Creates legacy code from day one (Feathers' definition)
- Tests written after implementation don't drive design
- "Later" often becomes "never" under deadline pressure
- Bug fixes without regression tests lead to recurring issues
- AI agents trained on "test later" produce untestable code

### Alternative 3: Cypress for E2E

**Description**: Popular E2E testing framework with time-travel debugging.

**Why rejected**:
- Playwright has better cross-browser support (WebKit/Safari)
- Playwright's parallelization is more mature
- Playwright trace viewer rivals Cypress's time-travel debugging
- Playwright has lower flakiness due to auto-waiting mechanisms
- Cypress has vendor lock-in concerns (commercial features)

### Alternative 4: Property-Based Testing as Primary Strategy

**Description**: Use fast-check or similar for generative testing instead of example-based.

**Why rejected**:
- Property-based testing is complementary, not primary
- Harder for junior developers and AI agents to understand
- Example-based tests serve as better documentation
- Still use property-based testing for critical algorithms (not excluded, just not primary)

## References

- AGENTS.md TDD Commandment (lines 23-48)
- Michael Feathers, "Working Effectively with Legacy Code" (seams, characterization tests)
- Kent Beck, "Test-Driven Development: By Example" (Red-Green-Refactor)
- Kent Beck, "4 Rules of Simple Design" (via Corey Haines)
- Vitest documentation: https://vitest.dev
- @effect/vitest documentation: https://effect.website/docs/guides/testing
- Playwright documentation: https://playwright.dev
- `@knowledge/tdd-patterns.md` - Internal knowledge base
- `skills_use(name="testing-patterns")` - Dependency breaking techniques catalog
