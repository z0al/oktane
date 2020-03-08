// Packages
import { Task } from 'redux-saga';
import { actionChannel } from 'redux-saga/effects';
import { take, call, put, fork, cancel } from 'redux-saga/effects';

// Ours
import { Request } from './utils/request';
import { Resolver, HandlerFunc } from './utils/resolver';
import { Respond, Fail, RequestEvent } from './utils/events';

export type Config = {
	resolver: Resolver;
};

export function* fetch(req: Request, func: HandlerFunc) {
	try {
		const result = yield call(func);
		return yield put(Respond(req, result));
	} catch (error) {
		return yield put(Fail(req, error));
	}
}

export function* main(config: Config) {
	const events = ['@fetch', '@abort'];
	const channel = yield actionChannel(events);

	// Keep a list of ongoing requests
	const ongoing = new Map<string, Task>();

	while (true) {
		const event: RequestEvent = yield take(channel);
		const { req } = event.payload;

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
