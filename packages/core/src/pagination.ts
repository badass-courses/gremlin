export interface Page<T> {
	items: T[];
	cursor?: string;
	hasMore: boolean;
}

export interface PaginationParams {
	cursor?: string;
	limit?: number;
	offset?: number;
}
