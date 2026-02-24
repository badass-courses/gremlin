export type GremlinErrorCode =
	| "NOT_FOUND"
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "VALIDATION"
	| "CONFLICT"
	| "INTERNAL";

export class GremlinError extends Error {
	public readonly code: GremlinErrorCode;
	public override readonly cause?: unknown;

	constructor(code: GremlinErrorCode, message: string, cause?: unknown) {
		super(message);
		this.name = "GremlinError";
		this.code = code;
		this.cause = cause;
	}
}
