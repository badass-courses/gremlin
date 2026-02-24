/// <reference lib="dom" />

export interface GremlinSession {
	user: {
		id: string;
		email?: string;
		name?: string;
		image?: string;
		roles: string[];
	} | null;
	expires: string;
}

export interface SessionProvider {
	/** Get session from request (reads cookies/headers) */
	getSession(request: Request): Promise<GremlinSession>;
	/** Get session or throw an unauthorized error */
	requireSession(
		request: Request,
	): Promise<GremlinSession & { user: NonNullable<GremlinSession["user"]> }>;
}
