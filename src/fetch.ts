// Ours
import * as t from './utils/types';
import * as o from './utils/operations';

import { from, subscribe, Stream } from './utils/streams';

/**
 *
 * @param options
 * @param fn
 */
const fetch = (
	{ emit, store }: t.ExchangeOptions,
	fn: t.FetchHandler
) => {
	// holds ongoing requests
	const queue = new Map<string, Stream>();

	const handle = (op: o.Operation) => {
		const { request } = op.payload;
		let stream = queue.get(request.id);

		if (op.type === 'cancel') {
			queue.delete(request.id);
			return stream?.close();
		}

		// Is running?
		if (stream && !stream.isClosed()) {
			// Lazy? pull next value
			if (stream.lazy) {
				stream.next();
			}

			return;
		}

		const context = { store };
		const source = from(fn(request, context));
		const meta = { lazy: source.lazy };

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
	};

	return (next: t.EmitFunc) => (op: o.Operation) => {
		// ignore irrelevant operations
		if (op.type === 'cancel' || op.type === 'fetch') {
			handle(op);
		}

		// next exchange
		return next(op);
	};
};

export const createFetch = (fn: t.FetchHandler): t.Exchange => ({
	name: 'fetch',
	init: (options) => fetch(options, fn),
});
