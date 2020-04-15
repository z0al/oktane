// Ours
import { Request } from '../request';
import { Cache } from '../utils/cache';
import { from, subscribe, Stream } from '../utils/streams';
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
	const queue = new Map<string, Stream>();

	return (next: EmitFunc) => (op: o.Operation) => {
		const { request } = op.payload;
		let stream = queue.get(request.id);

		if (op.type === 'cancel') {
			queue.delete(request.id);
			stream?.close();
		}

		if (op.type === 'fetch') {
			// Is running?
			if (stream && !stream.isClosed()) {
				// Pull Stream? pull next value
				if (stream.pull) {
					stream.next();
				}

				return next(op);
			}

			const context = { cache };
			const source = from(fn(request, context));
			const meta = { pull: source.pull };

			stream = subscribe(source, {
				next(data) {
					emit(o.$put(request, data, meta));
				},
				error(err) {
					emit(o.$reject(request, err));
				},
				complete(data) {
					emit(o.$complete(request, data));
				},
			});

			queue.set(request.id, stream);
		}

		// Proceed to next exchange
		return next(op);
	};
};

export const createFetch = (fn: FetchFunc): Exchange => ({
	name: 'fetch',
	init: (options) => fetch(options, fn),
});
