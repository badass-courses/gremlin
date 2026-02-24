import { getActiveSite, setActiveSite } from "../config";
import { CliCommandError } from "../envelope";
import type { CommandExecutionResult } from "./types";

const ACTIVE_SITE_KEY = "activeSite";

export async function runConfigCommand(
	args: string[],
): Promise<CommandExecutionResult> {
	const [action, key, value] = args;

	if (action === "set") {
		if (key !== ACTIVE_SITE_KEY || !value) {
			throw new CliCommandError({
				code: "VALIDATION",
				message: "Usage: gremlin config set activeSite <url>.",
				fix: "Provide the active site URL, for example: gremlin config set activeSite https://wizardshit.ai.",
				nextActions: [],
			});
		}

		const activeSite = await setActiveSite(value);
		return {
			result: {
				activeSite,
			},
			nextActions: [
				{
					command: "gremlin whoami",
					description: "Verify auth status for the active site.",
				},
			],
		};
	}

	if (action === "get") {
		if (key !== ACTIVE_SITE_KEY) {
			throw new CliCommandError({
				code: "VALIDATION",
				message: "Usage: gremlin config get activeSite.",
				fix: "Use the supported key `activeSite`.",
				nextActions: [],
			});
		}

		const activeSite = await getActiveSite();
		return {
			result: {
				activeSite,
			},
			nextActions: activeSite
				? [
						{
							command: "gremlin whoami",
							description: "Check session details for the active site.",
						},
					]
				: [
						{
							command: "gremlin config set activeSite <url>",
							description: "Set an active site before running content commands.",
						},
					],
		};
	}

	throw new CliCommandError({
		code: "VALIDATION",
		message: "Usage: gremlin config <set|get> activeSite [value].",
		fix: "Run either `gremlin config set activeSite <url>` or `gremlin config get activeSite`.",
		nextActions: [],
	});
}
