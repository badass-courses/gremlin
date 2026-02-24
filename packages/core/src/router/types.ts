import type { Effect } from "effect";
import type { z } from "zod";

/**
 * Marker type for unset builder properties.
 * Used for compile-time validation that required methods are called.
 */
export type UnsetMarker = "unsetMarker" & {
	__brand: "unsetMarker";
};

/**
 * Generic params interface for type-state tracking.
 * Each property tracks what's been set during the build chain.
 */
export interface AnyParams {
	_input: {
		in: unknown;
		out: unknown;
	};
	_middleware: unknown;
	_context: unknown;
	_output: unknown;
}

/**
 * Middleware function type.
 * Takes input and returns context that will be merged with handler context.
 */
export type MiddlewareFn<TInput = unknown, TContext = unknown> = (opts: {
	input: TInput extends UnsetMarker ? undefined : TInput;
}) => Effect.Effect<TContext, never, never> | TContext | Promise<TContext>;

/**
 * Handler return type.
 * Supports Effect, Promise, and synchronous values.
 */
export type HandlerResult<TOutput> =
	| Effect.Effect<TOutput, unknown, unknown>
	| Promise<TOutput>
	| TOutput;

/**
 * Handler function type.
 * Receives validated input and middleware context.
 */
export type HandlerFn<TInput, TContext, TOutput> = (opts: {
	input: TInput extends UnsetMarker ? undefined : TInput;
	ctx: TContext extends UnsetMarker ? Record<string, never> : TContext;
}) => HandlerResult<TOutput>;

/**
 * Built procedure type returned after handler is set.
 */
export interface Procedure<TParams extends AnyParams> {
	_def: {
		input: TParams["_input"]["in"] extends UnsetMarker
			? undefined
			: TParams["_input"]["in"];
		output: TParams["_output"];
		middlewares: MiddlewareFn[];
		handler: HandlerFn<
			TParams["_input"]["out"],
			TParams["_context"],
			TParams["_output"]
		>;
	};
	/** Type-level metadata for type inference */
	$types: {
		input: TParams["_input"]["in"] extends UnsetMarker
			? undefined
			: TParams["_input"]["in"];
		output: TParams["_output"];
		context: TParams["_context"] extends UnsetMarker
			? Record<string, never>
			: TParams["_context"];
	};
}

/**
 * Type-safe procedure builder with fluent API.
 * Uses UnsetMarker to enforce proper build order at compile time.
 */
export interface ProcedureBuilder<TParams extends AnyParams> {
	/**
	 * Set input validation schema.
	 * Can only be called once (compile-time enforced).
	 */
	input: <TSchema extends z.ZodType>(
		schema: TParams["_input"]["in"] extends UnsetMarker
			? TSchema
			: { __error: "input is already set" },
	) => ProcedureBuilder<{
		_input: {
			in: z.input<TSchema>;
			out: z.output<TSchema>;
		};
		_middleware: TParams["_middleware"];
		_context: TParams["_context"];
		_output: TParams["_output"];
	}>;

	/**
	 * Add middleware to inject context.
	 * Can be called multiple times - middlewares compose left-to-right.
	 */
	use: <TMiddlewareContext>(
		middleware: MiddlewareFn<TParams["_input"]["out"], TMiddlewareContext>,
	) => ProcedureBuilder<{
		_input: TParams["_input"];
		_middleware: TParams["_middleware"] extends UnsetMarker
			? [MiddlewareFn<TParams["_input"]["out"], TMiddlewareContext>]
			: TParams["_middleware"] extends readonly unknown[]
				? [
						...TParams["_middleware"],
						MiddlewareFn<TParams["_input"]["out"], TMiddlewareContext>,
					]
				: [MiddlewareFn<TParams["_input"]["out"], TMiddlewareContext>];
		_context: TParams["_context"] extends UnsetMarker
			? TMiddlewareContext
			: TParams["_context"] & TMiddlewareContext;
		_output: TParams["_output"];
	}>;

	/**
	 * Set the handler function (terminal operation).
	 * Returns a built Procedure, not a builder.
	 */
	handler: <TOutput>(
		handlerFn: HandlerFn<
			TParams["_input"]["out"],
			TParams["_context"],
			TOutput
		>,
	) => Procedure<{
		_input: TParams["_input"];
		_middleware: TParams["_middleware"];
		_context: TParams["_context"];
		_output: TOutput;
	}>;
}

/**
 * Router type - maps procedure names to procedures.
 */
export type Router = Record<string, Procedure<AnyParams>>;

/**
 * Extract input type from a procedure.
 */
export type inferProcedureInput<TProcedure> =
	TProcedure extends Procedure<infer TParams>
		? TParams["_input"]["in"] extends UnsetMarker
			? undefined
			: TParams["_input"]["in"]
		: never;

/**
 * Extract output type from a procedure.
 */
export type inferProcedureOutput<TProcedure> =
	TProcedure extends Procedure<infer TParams> ? TParams["_output"] : never;
