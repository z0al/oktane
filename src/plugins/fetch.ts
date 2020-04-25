// Ours
import { Request } from '../request';
import { Cache } from '../utils/cache';
import { Operation } from '../utils/operations';
import { subscribe, Subscription } from '../utils/sources';
import { Plugin, PluginOptions, EmitFunc } from '../utils/plugins';

interface FetchContext {
	cache: Cache;
}

export type FetchFunc = (request: Request, ctx?: FetchContext) => any;

/**
 *
 * @param options
 * @param fn
 */
const handler = ({ apply, cache }: PluginOptions, fn: FetchFunc) => {
	// holds ongoing requests
	const queue = new Map<string, Subscription>();

	return (next: EmitFunc) => (op: Operation) => {
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
					const meta = { lazy: subscription.lazy };
					apply('put', { request, data }, meta);
				},
				error(error) {
					apply('reject', { request, error });
				},
				complete(data) {
					apply('complete', { request, data });
				},
			});

			queue.set(request.id, subscription);
		}

		// Proceed to next plugin
		return next(op);
	};
};

export const createFetch = (fn: FetchFunc): Plugin => ({
	name: 'fetch',
	init: (options) => handler(options, fn),
});
