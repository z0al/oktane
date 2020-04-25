// Ours
import is from './utils/is';
import { Emitter } from './utils/emitter';
import { transition } from './utils/status';
import { Operation, $ } from './utils/operations';
import { Request, createRequest } from './request';
import { Result, exposeCache } from './utils/cache';
import { createFetch, FetchFunc } from './plugins/fetch';
import { pipe, Plugin, ApplyFunc } from './utils/plugins';

export type Subscriber = (change: Result) => void;

export interface Client {
	fetch(
		request: Request,
		cb?: Subscriber
	): {
		cancel(): void;
		refetch(): void;
		hasMore(): boolean;
		fetchMore(): void;
		unsubscribe(): void;
	};

	prefetch(request: Request): void;
}

export interface ClientOptions {
	fetch: FetchFunc;
	cache?: {
		// Max age for unused requests. Default is 30 seconds.
		maxAge?: number;
	};
	plugins?: Plugin[];
}

export const createClient = (options: ClientOptions): Client => {
	//The heart of this whole thing.
	const events = Emitter();

	// A key-value cache that maps requests to their status & data.
	const cache = new Map<string, Result>();

	// tracks prefetched requests to avoid potential refetching.
	const prefetched = new Set<string>();

	/**
	 * Extracts operation key
	 *
	 * @param op
	 */
	const keyOf = (op: Operation) => {
		return op.payload.request.id;
	};

	/**
	 * updates the cache and then notifies subscribers.
	 *
	 * @param op
	 */
	const update = (op: Operation) => {
		const key = keyOf(op);
		const obj = cache.get(key);

		const status = transition(obj?.status, op);

		if (status === 'disposed') {
			cache.delete(key);
			return op;
		}

		cache.set(key, {
			status,
			error: op.payload.error,
			data: op.payload.data !== undefined ? op.payload.data : obj?.data,
		});

		// notify subscribers
		events.emit(key, op);

		return op;
	};

	/**
	 * Compares the next status against the current status and pass
	 * the `op` through the pipeline if necessary.
	 *
	 * @param op
	 */
	const apply = ((): ApplyFunc => {
		const plugins = options.plugins || [];

		// Setup plugins
		const emit = pipe(
			[...plugins, createFetch(options.fetch)],
			update,
			exposeCache(cache)
		);

		return (type, payload, meta) => {
			const op = $(type, payload, meta);
			const current = cache.get(keyOf(op))?.status;
			const next = transition(current, op);

			// Skip any Operation that doesn't change the status. The only
			// exception is "put" operation since it doesn't change the
			// status when performed multiple times.
			if (current !== 'buffering' && next === current) {
				return op;
			}

			return emit(op);
		};
	})();

	/**
	 * Disposes unused requests. A request becomes unused if it had
	 * no listeners for `options.cache.maxAge` period.
	 */
	const garbage = (() => {
		// Holds result of setTimeout() calls
		const timers = new Map<string, any>();

		return (r: Request, dispose = true) => {
			if (dispose) {
				const collect = () => {
					apply('dispose', { request: r });
				};

				const { cache } = options;
				const after = !is.nullish(cache && cache.maxAge)
					? cache.maxAge
					: 30000; // 30s;

				// schedule disposal
				timers.set(r.id, setTimeout(collect, after));

				return;
			}

			// keep
			clearTimeout(timers.get(r.id));
			timers.delete(r.id);
		};
	})();

	/**
	 *
	 * @param query
	 * @param cb
	 */
	const fetch = (query: any, cb?: Subscriber) => {
		const request = query['@oktane/request']
			? (query as Request)
			: createRequest(query);

		const notify = () => {
			return cb(cache.get(request.id));
		};

		if (cb) {
			// cancel disposal if scheduled
			garbage(request, false);

			events.on(request.id, notify);
		} else {
			// This is probably a prefetching case. Mark immediately as
			// inactive so that it will be disposed if not used.
			garbage(request);
		}

		const hasMore = () => {
			// Lazy sources don't go to "buffering" status but rather
			// got back to "ready".
			return cache.get(request.id)?.status === 'ready';
		};

		const fetchMore = () => {
			if (__DEV__) {
				if (!hasMore()) {
					// warns the user about potential infinite loops
					console.warn(
						'Can not fetch more data. ' +
							'Make sure to guard calls to fetchMore() with hasMore().'
					);
				}
			}

			if (hasMore()) {
				apply('fetch', { request });
			}
		};

		const cancel = () => {
			apply('cancel', { request });
		};

		const refetch = () => {
			const { status } = cache.get(request.id) || {};

			if (
				status === 'completed' ||
				status === 'cancelled' ||
				status === 'failed'
			) {
				apply('fetch', { request });
			} else {
				if (__DEV__) {
					console.warn(
						'A request can only be refetched if it ' +
							'completed, failed or got cancelled.'
					);
				}
			}
		};

		const unsubscribe = () => {
			cb && events.off(request.id, notify);

			// cancel and schedule disposal if no longer needed
			if (!events.hasSubscribers(request.id)) {
				cancel();
				garbage(request);
			}
		};

		// The request might already be fetched via prefetch().
		const isPrefetched = prefetched.has(request.id);

		if (!isPrefetched) {
			apply('fetch', { request });
		} else {
			prefetched.delete(request.id);

			// call subscriber with the available result.
			notify();
		}

		return {
			cancel,
			refetch,
			hasMore,
			fetchMore,
			unsubscribe,
		};
	};

	/**
	 *
	 * @param query
	 */
	const prefetch = (query: any) => {
		const request = query['@oktane/request']
			? (query as Request)
			: createRequest(query);

		if (!prefetched.has(request.id)) {
			fetch(request);

			// mark as prefetched
			prefetched.add(request.id);
		}
	};

	return { fetch, prefetch };
};
