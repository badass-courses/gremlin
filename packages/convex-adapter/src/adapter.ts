import type {
	ContentResourceAdapter,
	ContentResourceWithResources,
	ListContentResourcesFilters,
	LoadResourceOptions,
} from '@gremlincms/db'
import type { ConvexHttpClient } from 'convex/browser'
import type { FunctionReference } from 'convex/server'

/**
 * Configuration for the Convex content resource adapter.
 *
 * The adapter delegates all operations to Convex query/mutation functions.
 * You must provide references to your Convex functions that implement
 * the ContentResource operations.
 */
export interface ConvexAdapterConfig {
	/** ConvexHttpClient instance (for server-side) or ConvexReactClient (for client-side) */
	client: ConvexHttpClient

	/** Convex function references for each operation */
	functions: {
		getContentResource: FunctionReference<'query'>
		listContentResources: FunctionReference<'query'>
		createContentResource: FunctionReference<'mutation'>
		updateContentResource: FunctionReference<'mutation'>
		deleteContentResource: FunctionReference<'mutation'>
		addResourceToResource: FunctionReference<'mutation'>
		removeResourceFromResource: FunctionReference<'mutation'>
		reorderResource: FunctionReference<'mutation'>
	}
}

/**
 * Convex adapter for ContentResource operations.
 *
 * Implements the ContentResourceAdapter interface by delegating
 * to Convex query and mutation functions. This keeps the adapter
 * thin — all business logic lives in your Convex functions.
 *
 * @example
 * ```ts
 * import { ConvexHttpClient } from 'convex/browser'
 * import { ConvexContentResourceAdapter } from '@gremlincms/convex-adapter'
 * import { api } from '../convex/_generated/api'
 *
 * const client = new ConvexHttpClient(process.env.CONVEX_URL!)
 * const adapter = new ConvexContentResourceAdapter({
 *   client,
 *   functions: {
 *     getContentResource: api.contentResources.get,
 *     listContentResources: api.contentResources.list,
 *     createContentResource: api.contentResources.create,
 *     updateContentResource: api.contentResources.update,
 *     deleteContentResource: api.contentResources.remove,
 *     addResourceToResource: api.contentResources.addChild,
 *     removeResourceFromResource: api.contentResources.removeChild,
 *     reorderResource: api.contentResources.reorder,
 *   },
 * })
 * ```
 */
export class ConvexContentResourceAdapter implements ContentResourceAdapter {
	private client: ConvexHttpClient
	private fns: ConvexAdapterConfig['functions']

	constructor(config: ConvexAdapterConfig) {
		this.client = config.client
		this.fns = config.functions
	}

	async getContentResource(
		idOrSlug: string,
		options?: LoadResourceOptions,
	): Promise<ContentResourceWithResources | null> {
		return this.client.query(this.fns.getContentResource, {
			idOrSlug,
			depth: options?.depth ?? 0,
		})
	}

	async listContentResources(
		filters: ListContentResourcesFilters = {},
		options?: LoadResourceOptions,
	): Promise<Awaited<ReturnType<ContentResourceAdapter['listContentResources']>>> {
		return this.client.query(this.fns.listContentResources, {
			...filters,
			depth: options?.depth ?? 0,
		})
	}

	async createContentResource(data: Parameters<ContentResourceAdapter['createContentResource']>[0]) {
		return this.client.mutation(this.fns.createContentResource, { data })
	}

	async updateContentResource(
		id: string,
		data: Parameters<ContentResourceAdapter['updateContentResource']>[1],
	) {
		return this.client.mutation(this.fns.updateContentResource, { id, data })
	}

	async deleteContentResource(id: string): Promise<boolean> {
		return this.client.mutation(this.fns.deleteContentResource, { id })
	}

	async addResourceToResource(
		resourceOfId: string,
		resourceId: string,
		data?: Parameters<ContentResourceAdapter['addResourceToResource']>[2],
	) {
		return this.client.mutation(this.fns.addResourceToResource, {
			resourceOfId,
			resourceId,
			data,
		})
	}

	async removeResourceFromResource(
		resourceOfId: string,
		resourceId: string,
	): Promise<boolean> {
		return this.client.mutation(this.fns.removeResourceFromResource, {
			resourceOfId,
			resourceId,
		})
	}

	async reorderResource(
		resourceOfId: string,
		resourceId: string,
		newPosition: number,
	) {
		return this.client.mutation(this.fns.reorderResource, {
			resourceOfId,
			resourceId,
			newPosition,
		})
	}
}
