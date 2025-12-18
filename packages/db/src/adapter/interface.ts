import type {
	ContentResource,
	ContentResourceResource,
	NewContentResource,
	NewContentResourceResource,
} from "../schema/index.js";

/**
 * Options for loading nested resources
 */
export interface LoadResourceOptions {
	/**
	 * Maximum depth for nested resource loading
	 * @default 0 (no nesting)
	 */
	depth?: number;
}

/**
 * ContentResource with nested resources
 */
export interface ContentResourceWithResources extends ContentResource {
	resources?: Array<
		ContentResourceResource & {
			resource: ContentResourceWithResources;
		}
	>;
}

/**
 * Database adapter interface for ContentResource operations
 *
 * Provides CRUD operations and nested resource loading.
 * Implementations should handle database-specific details.
 */
export interface ContentResourceAdapter {
	/**
	 * Get a single ContentResource by ID or slug
	 *
	 * @param idOrSlug - Resource ID or slug (format: {title}~{guid})
	 * @param options - Loading options (depth for nested resources)
	 * @returns Resource with nested resources if depth > 0
	 *
	 * @example
	 * // Load course with 2 levels of nesting (course → modules → lessons)
	 * const course = await adapter.getContentResource('intro-to-ts~cr_123', { depth: 2 })
	 */
	getContentResource(
		idOrSlug: string,
		options?: LoadResourceOptions,
	): Promise<ContentResourceWithResources | null>;

	/**
	 * List ContentResources with optional filters
	 *
	 * @param filters - Query filters
	 * @param options - Loading options
	 *
	 * @example
	 * const lessons = await adapter.listContentResources({ type: 'lesson' })
	 */
	listContentResources(
		filters?: {
			type?: string;
			createdById?: string;
			limit?: number;
			offset?: number;
		},
		options?: LoadResourceOptions,
	): Promise<ContentResourceWithResources[]>;

	/**
	 * Create a new ContentResource
	 *
	 * @param data - Resource data (ID generated if not provided)
	 * @returns Created resource
	 *
	 * @example
	 * const lesson = await adapter.createContentResource({
	 *   type: 'lesson',
	 *   createdById: 'user_123',
	 *   fields: {
	 *     title: 'Intro to TypeScript',
	 *     slug: 'intro-to-typescript~cr_abc',
	 *     state: 'draft'
	 *   }
	 * })
	 */
	createContentResource(data: NewContentResource): Promise<ContentResource>;

	/**
	 * Update a ContentResource
	 *
	 * @param id - Resource ID
	 * @param data - Partial update data
	 * @returns Updated resource
	 */
	updateContentResource(
		id: string,
		data: Partial<NewContentResource>,
	): Promise<ContentResource>;

	/**
	 * Delete a ContentResource (soft delete)
	 *
	 * @param id - Resource ID
	 * @returns Success boolean
	 */
	deleteContentResource(id: string): Promise<boolean>;

	/**
	 * Add a resource to another resource (create relationship)
	 *
	 * @param resourceOfId - Container resource ID
	 * @param resourceId - Contained resource ID
	 * @param data - Relationship data (position, metadata)
	 * @returns Created relationship
	 *
	 * @example
	 * // Add lesson to module at end
	 * await adapter.addResourceToResource('module_123', 'lesson_456', { position: 3.0 })
	 */
	addResourceToResource(
		resourceOfId: string,
		resourceId: string,
		data?: Partial<NewContentResourceResource>,
	): Promise<ContentResourceResource>;

	/**
	 * Remove a resource from another resource (delete relationship)
	 *
	 * @param resourceOfId - Container resource ID
	 * @param resourceId - Contained resource ID
	 * @returns Success boolean
	 */
	removeResourceFromResource(
		resourceOfId: string,
		resourceId: string,
	): Promise<boolean>;

	/**
	 * Reorder a resource within its container
	 *
	 * @param resourceOfId - Container resource ID
	 * @param resourceId - Resource to reorder
	 * @param newPosition - New fractional position
	 * @returns Updated relationship
	 */
	reorderResource(
		resourceOfId: string,
		resourceId: string,
		newPosition: number,
	): Promise<ContentResourceResource>;
}
