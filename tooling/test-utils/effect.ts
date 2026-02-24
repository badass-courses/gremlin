/**
 * Effect-TS test utilities
 *
 * Provides helpers for testing Effect-based code using @effect/vitest.
 *
 * Key patterns:
 * - Use it.effect() for tests that return Effect
 * - Use Effect.gen for readable async test code
 * - Test services through their interface, not implementation
 */

import { it } from "@effect/vitest";

/**
 * Re-export it.effect from @effect/vitest for convenience
 *
 * @example
 * ```ts
 * import { testEffect } from "@gremlincms/test-utils/effect";
 *
 * testEffect("my test", () =>
 *   Effect.gen(function* () {
 *     const result = yield* myEffect;
 *     expect(result).toBe(42);
 *   })
 * );
 * ```
 */
export const testEffect = it.effect;

/**
 * Re-export the full it object for access to other utilities
 *
 * @example
 * ```ts
 * import { it } from "@gremlincms/test-utils/effect";
 *
 * it.effect("test name", () => Effect.gen(...));
 * it.scoped("scoped test", () => Effect.gen(...));
 * ```
 */
export { it };

/**
 * Create a fake Effect service for testing
 *
 * This is the Effect-TS equivalent of createFake() but for services.
 *
 * @example
 * ```ts
 * class FakeUserService extends Service.Tag("UserService")<
 *   UserService,
 *   { getUser: (id: string) => Effect.Effect<User> }
 * >() {
 *   static Live = Layer.succeed(this, {
 *     getUser: (id) => Effect.succeed({ id, name: "Test User" })
 *   })
 * }
 * ```
 */
export function createFakeService<T>(tag: T) {
	return tag;
}
