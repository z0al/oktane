// Ours
import { on } from './utils/filter';
import { Request } from './request';
import { Exchange, ExchangeAPI, Cache } from './utils/types';
import { $complete, $buffer, $reject } from './utils/operations';
import {
	subscribe,
	fromStream,
	fromValue,
	Subscription,
} from './utils/streams';

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
		const source =
			request.type === 'stream'
				? fromStream(fn(request, context))
				: fromValue(fn(request, context));

		subscription = subscribe(source, {
			error: error => emit($reject(request, error)),
			next: data => {
				// We know for sure that non-streams will only resolve once
				// Let's save the time and complete them immediately
				request.type === 'stream'
					? emit($buffer(request, data))
					: emit($complete(request, data));
			},
			complete: () => {
				// Non-streams would already be completed on .next above
				request.type === 'stream' && emit($complete(request));
			},
		});

		ongoing.set(request.id, subscription);
	});
};

export const createFetch = (fn: FetchHandler): Exchange => ({
	name: 'fetch',
	init: options => fetch(options, fn),
});
