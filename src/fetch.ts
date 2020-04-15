// Ours
import { Request } from './request';
import * as o from './utils/operations';
import { ReadonlyStore } from './utils/cache';
import { from, subscribe, Stream } from './utils/streams';
import { Exchange, ExchangeOptions, EmitFunc } from './utils/pipe';

export type FetchFunc = (
	request: Request,
	ctx?: {
		store: ReadonlyStore;
	}
) => any;

/**
 *
 * @param options
 * @param fn
 */
const fetch = ({ emit, store }: ExchangeOptions, fn: FetchFunc) => {
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
			// Pull Stream? pull next value
			if (stream.pull) {
				stream.next();
			}

			return;
		}

		const context = { store };
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
	};

	return (next: EmitFunc) => (op: o.Operation) => {
		// ignore irrelevant operations
		if (op.type === 'cancel' || op.type === 'fetch') {
			handle(op);
		}

		// next exchange
		return next(op);
	};
};

export const createFetch = (fn: FetchFunc): Exchange => ({
	name: 'fetch',
	init: (options) => fetch(options, fn),
});
