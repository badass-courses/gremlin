type BufferEncoding = "utf8";

declare namespace NodeJS {
	interface ErrnoException extends Error {
		code?: string;
	}

	interface ProcessEnv {
		HOME?: string;
		[key: string]: string | undefined;
	}

	interface Process {
		argv: string[];
		env: ProcessEnv;
		cwd(): string;
		stdout: {
			write(chunk: string): boolean;
		};
		exit(code?: number): never;
	}
}

declare const process: NodeJS.Process;

declare module "node:path" {
	export function join(...paths: string[]): string;
	export function resolve(...paths: string[]): string;
}

declare module "node:fs/promises" {
	interface MkdirOptions {
		recursive?: boolean;
		mode?: string | number;
	}

	interface RmOptions {
		force?: boolean;
		recursive?: boolean;
		maxRetries?: number;
		retryDelay?: number;
	}

	export function mkdir(
		path: string,
		options?: MkdirOptions,
	): Promise<string | undefined>;
	export function readFile(path: string, encoding: BufferEncoding): Promise<string>;
	export function writeFile(
		path: string,
		data: string,
		encoding: BufferEncoding,
	): Promise<void>;
	export function rm(path: string, options?: RmOptions): Promise<void>;
}
