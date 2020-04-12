// Ours
import {
	Operation,
	$fetch,
	$cancel,
	$dispose,
	$buffer,
} from './utils/operations';
import { pipe } from './utils/pipe';
import { Request } from './request';
import { Emitter } from './utils/emitter';
import { transition, State } from './utils/state';
import { createFetch, FetchHandler } from './fetch';
import { Exchange, ExchangeAPI, Cache } from './utils/types';

export interface GCOptions {
	// Max age for inactive queries. Default is 30 seconds.
	maxAge?: number;
}

export interface ClientOptions {
	handler: FetchHandler;
	gc?: GCOptions;
	exchanges?: Array<Exchange>;
}

export type Subscriber = (state: State, data: any, err?: any) => void;

export type Client = ReturnType<typeof createClient>;

export const createClient = (options: ClientOptions) => {
	// A simple key-value cache. It uses the request ID as a key.
	const cacheMap = new Map<string, any>();

	// Holds the state of all requests.
	const stateMap = new Map<string, State>();

	// Keeps track of prefetched requests so we can avoid unnecessary
	// fetching.
	const prefetched = new Set<string>();

	//The heart of this whole thing.
	const events = Emitter();

	/**
	 * Extracts operation key
	 *
	 * @param op
	 */
	const keyOf = (op: Operation) => {
		return op.payload.request.id;
	};

	/**
	 * Emits an event of type `request.id` and `op` as a payload
	 *
	 * @param op
	 */
	const emit = (op: Operation) => {
		const key = keyOf(op);

		// Update cache if necessary
		if (op.type === 'buffer' || op.type === 'complete') {
			if (op.payload.data !== undefined) {
				cacheMap.set(key, op.payload.data);
			}
		}

		const next = transition(stateMap.get(key), op);

		if (next === 'disposed') {
			// Clean-up
			stateMap.delete(key);
			cacheMap.delete(key);
			return;
		}

		stateMap.set(key, next);
		events.emit(key, op);
	};

	/**
	 * Compares the next state against the current state and pass
	 * the `op` through the pipeline if necessary.
	 *
	 * @param op
	 */
	const apply = (() => {
		const exchanges = options.exchanges || [];
		const fetchExchange = createFetch(options.handler);

		const cache: Cache = {
			has: cacheMap.has.bind(cacheMap),
			get: cacheMap.get.bind(cacheMap),
			keys: cacheMap.keys.bind(cacheMap),
			values: cacheMap.values.bind(cacheMap),
			entries: cacheMap.entries.bind(cacheMap),
		};

		// Setup exchanges
		const api: ExchangeAPI = { emit, cache };
		const pipeThrough = pipe([...exchanges, fetchExchange], api);

		return (op: Operation) => {
			const current = stateMap.get(keyOf(op));
			const next = transition(current, op);

			// Rule:
			// If it won't change the current state DO NOT do it.
			// The ONLY exception is streaming.
			if (current !== 'streaming' && next === current) {
				return;
			}

			pipeThrough(op);
		};
	})();

	/**
	 * Disposes unused requests. A request becomes unused if it had
	 * no listeners for `options.gc.maxAge` period.
	 *
	 * @param eventState
	 */
	const garbage = (() => {
		// Holds result of setTimeout() calls
		const timers = new Map<string, any>();

		return (r: Request, keep?: boolean) => {
			if (keep) {
				clearTimeout(timers.get(r.id));
				timers.delete(r.id);

				return;
			}

			const dispose = () => {
				apply($dispose({ id: r.id }));
			};

			// schedule disposal
			const timeout = setTimeout(
				dispose,
				options.gc?.maxAge ?? 30 * 1000
			);

			timers.set(r.id, timeout);
		};
	})();

	/**
	 *
	 * @param request
	 * @param cb
	 */
	const fetch = (request: Request, cb?: Subscriber) => {
		const notify = (op: Operation) => {
			const state = stateMap.get(request.id);
			const data = cacheMap.get(request.id);

			if (op.type === 'reject') {
				return cb(state, data, op.payload.error);
			}

			return cb(state, data);
		};

		if (cb) {
			// cancel disposal if scheduled
			garbage(request, true);

			events.on(request.id, notify);
		} else {
			// This is probably a prefetching case. Mark immediately as
			// inactive so that it will be disposed if not used.
			garbage(request);
		}

		const hasMore = () => {
			// Lazy streams don't go to "streaming" state but rather
			// got back to "ready".
			return stateMap.get(request.id) === 'ready';
		};

		const fetchMore = () => {
			if (hasMore()) {
				apply($fetch(request));
			}
		};

		const cancel = () => {
			apply($cancel(request));
		};

		const unsubscribe = () => {
			cb && events.off(request.id, notify);

			// mark as garbage if necessary
			if (events.listenerCount(request.id) === 0) {
				garbage(request);
			}

			// Cancel if running but no longer needed
			if (
				(stateMap.get(request.id) === 'pending' ||
					stateMap.get(request.id) === 'streaming') &&
				events.listenerCount(request.id) === 0
			) {
				cancel();
			}
		};

		// The request might already be fetched via prefetch().
		const isPrefetched = prefetched.has(request.id);

		if (!isPrefetched) {
			apply($fetch(request));
		} else {
			prefetched.delete(request.id);

			// Notify subscriber. The type of operation we use has no
			// effect unless it's "reject".
			notify($buffer(request, cacheMap.get(request.id)));
		}

		return {
			cancel,
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
