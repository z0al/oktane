// Packages
import { Task } from 'redux-saga';
import { actionChannel } from 'redux-saga/effects';
import { take, call, put, fork, cancel } from 'redux-saga/effects';

// Ours
import { Request } from './utils/request';
import { Resolver, HandlerFunc } from './utils/resolver';
import { Event, EventType, RequestEvent } from './utils/events';

export type Config = {
	resolver: Resolver;
};

export function* fetch(req: Request, func: HandlerFunc) {
	try {
		const result = yield call(func);

		const success: Event = {
			type: '@data',
			data: {
				res: {
					request: {
						id: req.id,
						type: req.type,
					},
					data: result,
					done: true,
				},
			},
		};

		return yield put(success);
	} catch (error) {
		const failed: Event = {
			type: '@failed',
			data: {
				req: {
					id: req.id,
					type: req.type,
				},
				error,
			},
		};

		return yield put(failed);
	}
}

export function* main(config: Config) {
	const events: EventType[] = ['@fetch', '@abort'];
	const channel = yield actionChannel(events);

	// Keep a list of ongoing requests
	const ongoing = new Map<string, Task>();

	while (true) {
		const event: RequestEvent = yield take(channel);
		const { req } = event.data;

		// Deduplicate or cancel pending requests
		let task = ongoing.get(req.id);
		if (task?.isRunning()) {
			if (event.type === '@abort') {
				yield cancel(task);
				ongoing.delete(req.id);
			}

			continue;
		}

		// Either we didn't recognize the request or it has already
		// completed.
		if (event.type === '@abort') {
			continue;
		}

		const handler = yield call(config.resolver, req);

		// Run and keep track
		task = yield fork(fetch, req, handler);
		ongoing.set(req.id, task);
	}
}
