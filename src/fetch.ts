// Ours
import { on } from './utils/filter';
import { Request } from './request';
import { Exchange, ExchangeOptions } from './utils/types';
import { Observable } from './utils/observable';
import { $complete, $buffer, $reject } from './utils/operations';

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

		// May resolve multiple times
		if (request.type === 'stream') {
			const sub = Observable.from(fn(request)).subscribe({
				next: data => emit($buffer(request, data)),
				error: error => emit($reject(request, error)),
				complete: () => emit($complete(request)),
			});

			task = {
				isRunning: () => !sub.closed,
				cancel: () => sub.unsubscribe(),
			};
		} else {
			let ended = false;

			task = {
				isRunning: () => !ended,
				cancel: () => {
					ended = true;
				},
			};

			// Query or Mutation
			(async () => {
				try {
					const data = await fn(request);

					// It maybe have been cancelled
					if (task.isRunning()) {
						emit($complete(request, data));
					}
				} catch (error) {
					emit($reject(request, error));
				} finally {
					ended = true;
				}
			})();
		}

		ongoing.set(request.id, task);
	});
};

export const createFetch = (fn: FetchHandler): Exchange => ({
	name: 'fetch',
	init: options => fetch(options, fn),
});
