// Packages
import invariant from 'tiny-invariant';

// Ours
import * as o from './utils/operations';

import is from './utils/is';
import { Request } from './request';
import { Emitter } from './utils/emitter';
import { transition } from './utils/status';
import { Result, mapToCache } from './utils/cache';
import { pipe, Plugin } from './utils/plugins';
import { createFetch, FetchFunc } from './plugins/fetch';

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

	// A key-value store that maps requests to their status & data.
	const store = new Map<string, Result>();

	// tracks prefetched requests to avoid potential refetching.
	const prefetched = new Set<string>();

	/**
	 * Extracts operation key
	 *
	 * @param op
	 */
	const keyOf = (op: o.Operation) => {
		return op.payload.request.id;
	};

	/**
	 * updates the cache and then notifies subscribers.
	 *
	 * @param op
	 */
	const updateCache = (op: o.Operation) => {
		const key = keyOf(op);

		const obj = store.get(key);

		const next = transition(obj?.status, op);

		if (next === 'disposed') {
			store.delete(key);
			return op;
		}

		store.set(key, {
			status: next,
			error: op.type === 'reject' ? op.payload.error : undefined,
			data:
				op.type === 'put' ||
				(op.type === 'complete' && op.payload.data !== undefined)
					? op.payload.data
					: obj?.data,
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
	const apply = (() => {
		const plugins = options.plugins || [];
		const fetchPlugin = createFetch(options.fetch);

		// Setup plugins
		const api = { emit: updateCache, cache: mapToCache(store) };
		const pipeThrough = pipe([...plugins, fetchPlugin], api);

		return (op: o.Operation) => {
			const current = store.get(keyOf(op))?.status;
			const next = transition(current, op);

			// Rule:
			// If it won't change the current status DO NOT do it.
			// The ONLY exception is buffering.
			if (current !== 'buffering' && next === current) {
				return;
			}

			pipeThrough(op);
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
					apply(o.$dispose({ id: r.id }));
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
	 * @param request
	 * @param cb
	 */
	const fetch = (request: Request, cb?: Subscriber) => {
		const notify = () => {
			return cb(store.get(request.id));
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
			return store.get(request.id)?.status === 'ready';
		};

		const fetchMore = () => {
			if (!hasMore()) {
				// warns the user about potential infinite loops in their code
				if (__DEV__) {
					invariant(
						false,
						'Can not fetch more data. ' +
							'Make sure to guard calls to fetchMore() with hasMore().'
					);
				}
			}

			if (hasMore()) {
				apply(o.$fetch(request));
			}
		};

		const cancel = () => {
			apply(o.$cancel(request));
		};

		const refetch = () => {
			const { status } = store.get(request.id) || {};

			if (
				status === 'completed' ||
				status === 'cancelled' ||
				status === 'failed'
			) {
				apply(o.$fetch(request));
			} else {
				if (__DEV__) {
					invariant(
						false,
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
			apply(o.$fetch(request));
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
	 * @param request
	 */
	const prefetch = (request: Request) => {
		if (!prefetched.has(request.id)) {
			fetch(request);

			// mark as prefetched
			prefetched.add(request.id);
		}
	};

	return { fetch, prefetch };
};
