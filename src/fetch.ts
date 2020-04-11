// Ours
import { on } from './utils/filter';
import { Request } from './request';
import { Exchange, ExchangeAPI, Cache } from './utils/types';
import { $complete, $buffer, $reject } from './utils/operations';
import { subscribe, fromAny, Subscription } from './utils/sources';

type FetchContext = {
	cache: Cache;
};

export type FetchHandler = (req: Request, ctx?: FetchContext) => any;

const fetch = ({ emit, cache }: ExchangeAPI, fn: FetchHandler) => {
	const ongoing = new Map<string, Subscription>();

	return on(['fetch', 'cancel'], op => {
		const { request } = op.payload;
		let subscription = ongoing.get(request.id);

		if (op.type === 'cancel') {
			ongoing.delete(request.id);
			return subscription?.close();
		}

		if (subscription && !subscription.isClosed()) {
			return;
		}

		const context = { cache };
		const source = fromAny(fn(request, context));

		subscription = subscribe(source, {
			next(data) {
				emit($buffer(request, data));
			},
			error(err) {
				emit($reject(request, err));
			},
			complete(data) {
				emit($complete(request, data));
			},
		});

		ongoing.set(request.id, subscription);
	});
};

export const createFetch = (fn: FetchHandler): Exchange => ({
	name: 'fetch',
	init: options => fetch(options, fn),
});
