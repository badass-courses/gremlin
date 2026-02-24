export type NextAction = {
	command: string;
	description: string;
	params?: Record<
		string,
		{
			value?: string;
			default?: string;
			enum?: string[];
			description?: string;
		}
	>;
};

export type CliResponse = {
	ok: boolean;
	command: string;
	result?: unknown;
	error?: { message: string; code: string };
	fix?: string;
	next_actions: NextAction[];
};

export interface CliCommandErrorInput {
	message: string;
	code: string;
	fix: string;
	nextActions?: NextAction[];
	cause?: unknown;
}

export class CliCommandError extends Error {
	public readonly code: string;
	public readonly fix: string;
	public readonly nextActions: NextAction[];
	public override readonly cause?: unknown;

	constructor(input: CliCommandErrorInput) {
		super(input.message);
		this.name = "CliCommandError";
		this.code = input.code;
		this.fix = input.fix;
		this.nextActions = input.nextActions ?? [];
		this.cause = input.cause;
	}
}

function writeResponse(response: CliResponse, exitCode: number): never {
	process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
	process.exit(exitCode);
}

export function success(
	command: string,
	result: unknown,
	nextActions: NextAction[],
): never {
	return writeResponse(
		{
			ok: true,
			command,
			result,
			next_actions: nextActions,
		},
		0,
	);
}

export function failure(
	command: string,
	error: { message: string; code: string },
	fix: string,
	nextActions: NextAction[],
): never {
	return writeResponse(
		{
			ok: false,
			command,
			error,
			fix,
			next_actions: nextActions,
		},
		1,
	);
}

export function normalizeCliError(error: unknown): CliCommandError {
	if (error instanceof CliCommandError) {
		return error;
	}

	if (error instanceof Error) {
		return new CliCommandError({
			code: "INTERNAL",
			message: error.message,
			fix: "Review the error and re-run the command.",
			nextActions: [],
			cause: error,
		});
	}

	return new CliCommandError({
		code: "INTERNAL",
		message: "Unexpected error.",
		fix: "Re-run the command and check command arguments.",
		nextActions: [],
		cause: error,
	});
}
