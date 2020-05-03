// Ours
import { Request } from '../request';
import { Cache } from '../utils/cache';
import { Operation, $ } from '../utils/operations';
import { Plugin, PluginOptions, EmitFunc } from './api';
import { subscribe, Subscription } from '../utils/sources';

interface FetchContext {
	cache: Cache;
}

export type FetchFunc = (request: Request, ctx?: FetchContext) => any;

/**
 *
 * @param options
 * @param fn
 */
const handler = ({ emit, cache }: PluginOptions, fn: FetchFunc) => {
	// holds ongoing requests
	const queue = new Map<string, Subscription>();

	return (next: EmitFunc) => (op: Operation) => {
		// Run after the pipeline since some plugins may change
		// the operation type.
		op = next(op);

		if (op) {
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

					return op;
				}

				const context = { cache };

				subscription = subscribe(fn(request, context), {
					next(data) {
						const meta = { lazy: subscription.lazy };
						emit($('put', { request, data }, meta));
					},
					error(error) {
						emit($('reject', { request, error }));
					},
					complete(data) {
						emit($('complete', { request, data }));
					},
				});

				queue.set(request.id, subscription);
			}
		}

		return op;
	};
};

export const createFetch = (fn: FetchFunc): Plugin => ({
	name: 'core/fetch',
	init: (options) => handler(options, fn),
});
