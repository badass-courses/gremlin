import type { NextAction } from "../envelope";

export interface CommandExecutionResult {
	result: unknown;
	nextActions: NextAction[];
}
