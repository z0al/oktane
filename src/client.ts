// Ours
import { Emitter } from './utils/emitter';
import { dedupe } from './plugins/dedupe';
import { transition } from './utils/status';
import { pipe, Plugin } from './plugins/api';
import { Operation, $ } from './utils/operations';
import { Request, createRequest } from './request';
import { Result, exposeCache } from './utils/cache';
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
		// A timeout for unused requests. Default is 30 seconds.
		disposeTime?: number;
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
	 * updates the cache and then notifies subscribers.
	 *
	 * @param op
	 */
	const apply = (op: Operation) => {
		const key = op.payload.request.id;
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

	// Set default options
	options = {
		plugins: [],
		...options,
		cache: {
			disposeTime: 30 * 1000, // 30s
			...options.cache,
		},
	};

	// Setup plugins
	const emit = pipe(
		[dedupe, createFetch(options.fetch), ...options.plugins],
		apply,
		exposeCache(cache)
	);

	/**
	 * Disposes unused requests. A request becomes unused if it had
	 * no listeners for `options.cache.disposeTime` period.
	 */
	const garbage = (() => {
		// Holds result of setTimeout() calls
		const timers = new Map<string, any>();

		return (request: Request, dispose = true) => {
			if (dispose) {
				const collect = () => {
					emit($('dispose', { request }));
				};

				// schedule disposal
				timers.set(
					request.id,
					setTimeout(collect, options.cache.disposeTime)
				);

				return;
			}

			// keep
			clearTimeout(timers.get(request.id));
			timers.delete(request.id);
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
				emit($('fetch', { request }));
			}
		};

		const cancel = () => {
			emit($('cancel', { request }));
		};

		const refetch = () => {
			emit($('cancel', { request }));
			emit($('fetch', { request }));
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
			emit($('fetch', { request }));
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
