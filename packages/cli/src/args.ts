import { CliCommandError } from "./envelope";

export interface ParsedArgs {
	flags: Record<string, string>;
	positional: string[];
}

export function parseArgs(args: string[]): ParsedArgs {
	const flags: Record<string, string> = {};
	const positional: string[] = [];

	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];
		if (argument === undefined) {
			continue;
		}

		if (argument.startsWith("--")) {
			const withoutPrefix = argument.slice(2);
			if (withoutPrefix.length === 0) {
				continue;
			}

			const equalsIndex = withoutPrefix.indexOf("=");
			if (equalsIndex >= 0) {
				const key = withoutPrefix.slice(0, equalsIndex);
				const value = withoutPrefix.slice(equalsIndex + 1);
				if (key.length > 0) {
					flags[key] = value;
				}
				continue;
			}

			const nextValue = args[index + 1];
			if (nextValue && !nextValue.startsWith("--")) {
				flags[withoutPrefix] = nextValue;
				index += 1;
				continue;
			}

			flags[withoutPrefix] = "true";
			continue;
		}

		positional.push(argument);
	}

	return {
		flags,
		positional,
	};
}

export function parseJsonFlag(
	value: string | undefined,
	flagName: string,
): unknown | undefined {
	if (value === undefined) {
		return undefined;
	}

	try {
		return JSON.parse(value);
	} catch (error) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: `Invalid JSON provided for ${flagName}.`,
			fix: `Pass valid JSON to ${flagName}, for example: ${flagName} '{"key":"value"}'.`,
			nextActions: [],
			cause: error,
		});
	}
}

export function parsePositiveIntegerFlag(
	value: string | undefined,
	flagName: string,
): number | undefined {
	if (value === undefined) {
		return undefined;
	}

	const parsed = Number.parseInt(value, 10);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: `${flagName} must be a positive integer.`,
			fix: `Provide a numeric value, for example: ${flagName} 20.`,
			nextActions: [],
		});
	}

	return parsed;
}

export function requireFlag(
	flags: Record<string, string>,
	name: string,
): string {
	const value = flags[name];
	if (!value) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: `Missing required flag --${name}.`,
			fix: `Add --${name} <value> to the command.`,
			nextActions: [],
		});
	}

	return value;
}
