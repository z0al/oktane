// Ours
import { Request } from '../request';
import { Cache } from '../utils/cache';
import { subscribe, Subscription } from '../utils/sources';
import {
	Exchange,
	ExchangeOptions,
	EmitFunc,
} from '../utils/exchanges';

import * as o from '../utils/operations';

interface FetchContext {
	cache: Cache;
}

export type FetchFunc = (request: Request, ctx?: FetchContext) => any;

/**
 *
 * @param options
 * @param fn
 */
const fetch = ({ emit, cache }: ExchangeOptions, fn: FetchFunc) => {
	// holds ongoing requests
	const queue = new Map<string, Subscription>();

	return (next: EmitFunc) => (op: o.Operation) => {
		const { request } = op.payload;
		let subscription = queue.get(request.id);

		if (op.type === 'cancel') {
			queue.delete(request.id);
			subscription?.close();
		}

		if (op.type === 'fetch') {
			// Is running?
			if (subscription && !subscription.isClosed()) {
				// Lazy? emit next value
				if (subscription.lazy) {
					subscription.next();
				}

				return next(op);
			}

			const context = { cache };

			subscription = subscribe(fn(request, context), {
				next(data) {
					emit(
						o.$put(request, data, {
							lazy: subscription.lazy,
						})
					);
				},
				error(err) {
					emit(o.$reject(request, err));
				},
				complete(data) {
					emit(o.$complete(request, data));
				},
			});

			queue.set(request.id, subscription);
		}

		// Proceed to next exchange
		return next(op);
	};
};

export const createFetch = (fn: FetchFunc): Exchange => ({
	name: 'fetch',
	init: (options) => fetch(options, fn),
});
