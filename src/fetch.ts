// Ours
import { on } from './utils/filter';
import { Request } from './request';
import { from, subscribe, Stream } from './utils/streams';
import { Exchange, ExchangeAPI, Cache } from './utils/types';
import { $complete, $buffer, $reject } from './utils/operations';

type FetchContext = {
	cache: Cache;
};

export type FetchHandler = (req: Request, ctx?: FetchContext) => any;

const fetch = ({ emit, cache }: ExchangeAPI, fn: FetchHandler) => {
	// holds ongoing requests
	const queue = new Map<string, Stream>();

	// holds busy streams. In other words, a previous call to
	// stream.next() is pending.
	const busy = new Map<string, boolean>();

	return on(['fetch', 'cancel'], op => {
		const { request } = op.payload;
		let stream = queue.get(request.id);

		if (op.type === 'cancel') {
			queue.delete(request.id);
			return stream?.close();
		}

		// Is streaming?
		if (stream && !stream.isClosed()) {
			const isBusy = busy.get(request.id) ?? false;

			// Lazy? pull next value
			if (stream.lazy && !isBusy) {
				busy.set(request.id, true);

				stream.next().finally(() => {
					busy.set(request.id, false);
				});
			}

			return;
		}

		const context = { cache };
		const source = from(fn(request, context));

		stream = subscribe(source, {
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

		queue.set(request.id, stream);
	});
};

export const createFetch = (fn: FetchHandler): Exchange => ({
	name: 'fetch',
	init: options => fetch(options, fn),
});
