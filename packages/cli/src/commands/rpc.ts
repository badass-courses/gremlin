import { parseArgs, parseJsonFlag } from "../args";
import { rpc } from "../client";
import { CliCommandError } from "../envelope";
import type { CommandExecutionResult } from "./types";

export async function runRpcCommand(
	args: string[],
): Promise<CommandExecutionResult> {
	const parsed = parseArgs(args);
	const procedure = parsed.positional[0];
	if (!procedure) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: "Usage: gremlin rpc <procedure> [--input <json>].",
			fix: "Provide a procedure name and optional input payload.",
			nextActions: [],
		});
	}

	const input = parseJsonFlag(parsed.flags.input, "--input");
	const result = await rpc(procedure, input);

	return {
		result,
		nextActions: [
			{
				command: `gremlin rpc ${procedure} --input <json>`,
				description: "Re-run the procedure with different input.",
			},
			{
				command: "gremlin content list",
				description: "Run a standard content list call.",
			},
		],
	};
}
