/// <reference lib="dom" />

import type { GremlinSession } from "./auth";
import { GremlinError } from "./errors";
import type { AnyParams, Procedure, inferProcedureOutput } from "./router";

interface SafeParseSuccess<TData> {
	success: true;
	data: TData;
}

interface SafeParseFailure {
	success: false;
	error: unknown;
}

type SafeParseResult<TData> = SafeParseSuccess<TData> | SafeParseFailure;

interface SafeParser<TData = unknown> {
	safeParse(input: unknown): SafeParseResult<TData>;
}

interface EffectRuntime {
	isEffect(value: unknown): boolean;
	runPromise<TValue>(effect: unknown): Promise<TValue>;
}

let effectRuntimePromise: Promise<EffectRuntime | null> | null = null;

export interface ExecutionContext {
	request: Request;
	session: GremlinSession;
	headers: Headers;
}

function isSafeParser(value: unknown): value is SafeParser {
	if (!value || typeof value !== "object") {
		return false;
	}

	return (
		"safeParse" in value &&
		typeof (value as { safeParse?: unknown }).safeParse === "function"
	);
}

function isPromiseLike<TValue>(value: unknown): value is PromiseLike<TValue> {
	if (value === null) {
		return false;
	}
	if (typeof value !== "object" && typeof value !== "function") {
		return false;
	}

	return (
		"then" in value && typeof (value as { then?: unknown }).then === "function"
	);
}

function isMissingEffectModuleError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	return (
		error.message.includes("Cannot find package 'effect'") ||
		error.message.includes("Cannot find module 'effect'")
	);
}

async function loadEffectRuntime(): Promise<EffectRuntime | null> {
	if (effectRuntimePromise) {
		return effectRuntimePromise;
	}

	effectRuntimePromise = (async () => {
		try {
			const effectModule = (await import("effect")) as {
				Effect?: Partial<EffectRuntime>;
			};

			if (
				effectModule.Effect &&
				typeof effectModule.Effect.isEffect === "function" &&
				typeof effectModule.Effect.runPromise === "function"
			) {
				return effectModule.Effect as EffectRuntime;
			}

			return null;
		} catch (error) {
			if (isMissingEffectModuleError(error)) {
				return null;
			}

			throw error;
		}
	})();

	return effectRuntimePromise;
}

async function resolveResult<TValue>(result: unknown): Promise<TValue> {
	const effectRuntime = await loadEffectRuntime();

	if (effectRuntime?.isEffect(result)) {
		return effectRuntime.runPromise<TValue>(result);
	}

	if (isPromiseLike<TValue>(result)) {
		return await result;
	}

	return result as TValue;
}

function mergeMiddlewareContext(
	currentContext: Record<string, unknown>,
	middlewareContext: unknown,
): Record<string, unknown> {
	if (middlewareContext === undefined || middlewareContext === null) {
		return currentContext;
	}

	if (typeof middlewareContext !== "object") {
		throw new GremlinError(
			"INTERNAL",
			"Middleware must return an object context.",
			middlewareContext,
		);
	}

	return {
		...currentContext,
		...middlewareContext,
	};
}

export async function executeProcedure<TProcedure extends Procedure<AnyParams>>(
	procedure: TProcedure,
	input: unknown,
	context: ExecutionContext,
): Promise<inferProcedureOutput<TProcedure>> {
	let validatedInput = input;

	if (procedure._def.input !== undefined) {
		if (!isSafeParser(procedure._def.input)) {
			throw new GremlinError(
				"INTERNAL",
				"Procedure input schema must provide safeParse.",
				procedure._def.input,
			);
		}

		const parseResult = procedure._def.input.safeParse(input);
		if (!parseResult.success) {
			throw new GremlinError(
				"VALIDATION",
				"Input validation failed.",
				parseResult.error,
			);
		}

		validatedInput = parseResult.data;
	}

	let mergedContext: Record<string, unknown> = {
		request: context.request,
		session: context.session,
		headers: context.headers,
	};

	for (const middleware of procedure._def.middlewares) {
		const middlewareResult = middleware({
			input: validatedInput as never,
		});

		const resolvedMiddlewareContext = await resolveResult<Record<string, unknown>>(
			middlewareResult,
		);

		mergedContext = mergeMiddlewareContext(
			mergedContext,
			resolvedMiddlewareContext,
		);
	}

	const handlerResult = procedure._def.handler({
		input: validatedInput as never,
		ctx: mergedContext as never,
	});

	return await resolveResult<inferProcedureOutput<TProcedure>>(handlerResult);
}
