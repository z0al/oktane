// Ours
import { on } from './utils/filter';
import { Request } from './request';
import { Exchange, ExchangeOptions } from './utils/types';
import { $complete, $buffer, $reject } from './utils/operations';
import { subscribe, fromStream, fromValue } from './utils/streams';

export type FetchHandler = (req: Request) => any;

interface Task {
	isRunning: () => boolean;
	cancel: () => void;
}

const fetch = ({ emit }: ExchangeOptions, fn: FetchHandler) => {
	const ongoing = new Map<string, Task>();

	return on(['fetch', 'cancel'], op => {
		const { request } = op.payload;
		let task = ongoing.get(request.id);

		if (op.type === 'cancel') {
			ongoing.delete(request.id);
			return task?.cancel();
		}

		if (task?.isRunning()) {
			return;
		}

		const source =
			request.type === 'stream'
				? fromStream(fn(request))
				: fromValue(fn(request));

		const { close, closed } = subscribe(source, {
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

		task = {
			isRunning: () => !closed,
			cancel: () => close(),
		};

		ongoing.set(request.id, task);
	});
};

export const createFetch = (fn: FetchHandler): Exchange => ({
	name: 'fetch',
	init: options => fetch(options, fn),
});
