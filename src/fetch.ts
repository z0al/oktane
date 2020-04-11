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
	const ongoing = new Map<string, Stream>();

	return on(['fetch', 'cancel'], op => {
		const { request } = op.payload;
		let stream = ongoing.get(request.id);

		if (op.type === 'cancel') {
			ongoing.delete(request.id);
			return stream?.close();
		}

		// Is streaming?
		if (stream && !stream.isClosed()) {
			// Lazy? pull next value
			if (stream.lazy) {
				stream.next();
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

		ongoing.set(request.id, stream);
	});
};

export const createFetch = (fn: FetchHandler): Exchange => ({
	name: 'fetch',
	init: options => fetch(options, fn),
});
