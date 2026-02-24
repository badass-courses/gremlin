/**
 * @gremlincms/core - Type-safe router builder with Effect integration
 *
 * @example
 * ```typescript
 * import { createRouter, procedure } from '@gremlincms/core'
 * import { Effect } from 'effect'
 * import { z } from 'zod'
 *
 * const router = createRouter({
 *   getUser: procedure
 *     .input(z.object({ id: z.string() }))
 *     .handler(({ input }) =>
 *       Effect.succeed({ id: input.id, name: 'Alice' })
 *     ),
 * })
 * ```
 */

export {
	composeMiddleware,
	createContextMiddleware,
	createRouter,
	procedure,
} from "./router";
export type {
	AnyParams,
	HandlerFn,
	MiddlewareFn,
	Procedure,
	ProcedureBuilder,
	Router,
	UnsetMarker,
	inferProcedureInput,
	inferProcedureOutput,
} from "./router";

export {
	ContentResourceSchema,
	CreateContentResourceSchema,
	UpdateContentResourceSchema,
} from "./schemas";
export type {
	ContentResource,
	CreateContentResource,
	UpdateContentResource,
} from "./schemas";

export { GremlinError } from "./errors";
export type { GremlinErrorCode } from "./errors";

export type { GremlinSession, SessionProvider } from "./auth";

export type { Page, PaginationParams } from "./pagination";
