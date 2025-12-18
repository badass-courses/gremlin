import type { z } from "zod";
import type {
	AnyParams,
	HandlerFn,
	MiddlewareFn,
	Procedure,
	ProcedureBuilder,
	UnsetMarker,
} from "./types";

/**
 * Internal builder implementation.
 * Creates a new builder instance for each method call (immutable chain).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createBuilderInternal<TParams extends AnyParams>(
	_def: { input?: z.ZodType; middleware?: MiddlewareFn<unknown, unknown> } = {},
): ProcedureBuilder<TParams> {
	return {
		input(schema) {
			return createBuilderInternal({
				..._def,
				input: schema as z.ZodType,
			}) as any;
		},

		use(middleware) {
			return createBuilderInternal({
				..._def,
				middleware: middleware as MiddlewareFn<unknown, unknown>,
			}) as any;
		},

		handler(handlerFn) {
			return {
				_def: {
					input: _def.input,
					output: undefined,
					middleware: _def.middleware,
					handler: handlerFn as HandlerFn<unknown, unknown, unknown>,
				},
				$types: {
					input: _def.input,
					output: undefined,
					context: undefined,
				},
			} as any;
		},
	};
}

/**
 * Create a new procedure builder.
 * Entry point for defining type-safe API procedures.
 *
 * @example
 * ```typescript
 * const getUserProcedure = procedure
 *   .input(z.object({ id: z.string() }))
 *   .use(authMiddleware)
 *   .handler(async ({ input, ctx }) => {
 *     return Effect.succeed({ user: await getUser(input.id) })
 *   })
 * ```
 */
export const procedure: ProcedureBuilder<{
	_input: { in: UnsetMarker; out: UnsetMarker };
	_middleware: UnsetMarker;
	_context: UnsetMarker;
	_output: UnsetMarker;
}> = createBuilderInternal();

/**
 * Create a router from a map of procedures.
 *
 * @example
 * ```typescript
 * const router = createRouter({
 *   getUser: procedure
 *     .input(GetUserSchema)
 *     .handler(({ input }) => Effect.succeed({ id: input.id })),
 *   updateUser: procedure
 *     .input(UpdateUserSchema)
 *     .use(authMiddleware)
 *     .handler(({ input, ctx }) => updateUserEffect(input, ctx))
 * })
 * ```
 */
export function createRouter<
	TRouter extends Record<string, Procedure<AnyParams>>,
>(procedures: TRouter): TRouter {
	return procedures;
}
