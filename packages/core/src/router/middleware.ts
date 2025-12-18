import { Effect } from "effect";
import type { MiddlewareFn } from "./types";

/**
 * Compose multiple middleware functions left-to-right.
 * Each middleware receives input and can extend the context.
 * Contexts are merged sequentially.
 *
 * @example
 * ```typescript
 * const combined = composeMiddleware(
 *   authMiddleware,
 *   loggingMiddleware,
 *   rateLimitMiddleware
 * )
 * ```
 */
export function composeMiddleware<TInput, TContext1, TContext2>(
	first: MiddlewareFn<TInput, TContext1>,
	second: MiddlewareFn<TInput, TContext2>,
): MiddlewareFn<TInput, TContext1 & TContext2> {
	return async (opts) => {
		const ctx1 = await first(opts);
		const ctx2 = await second(opts);

		// Handle Effect returns
		const resolvedCtx1 =
			ctx1 && typeof ctx1 === "object" && "_tag" in ctx1
				? await Effect.runPromise(
						ctx1 as Effect.Effect<TContext1, never, never>,
					)
				: ctx1;

		const resolvedCtx2 =
			ctx2 && typeof ctx2 === "object" && "_tag" in ctx2
				? await Effect.runPromise(
						ctx2 as Effect.Effect<TContext2, never, never>,
					)
				: ctx2;

		return { ...resolvedCtx1, ...resolvedCtx2 } as TContext1 & TContext2;
	};
}

/**
 * Create a middleware that extends context with additional properties.
 *
 * @example
 * ```typescript
 * const withTimestamp = createContextMiddleware(() => ({
 *   timestamp: Date.now()
 * }))
 * ```
 */
export function createContextMiddleware<TContext>(
	contextFn: () =>
		| TContext
		| Promise<TContext>
		| Effect.Effect<TContext, never, never>,
): MiddlewareFn<unknown, TContext> {
	return async (): Promise<TContext> => {
		const result = contextFn();

		// Handle Effect
		if (result && typeof result === "object" && "_tag" in result) {
			return await Effect.runPromise(
				result as Effect.Effect<TContext, never, never>,
			);
		}

		// Handle Promise
		if (result instanceof Promise) {
			return await result;
		}

		// Direct value
		return result as TContext;
	};
}
