// Packages
import { Task } from 'redux-saga';
import { actionChannel } from 'redux-saga/effects';
import { take, call, put, fork, cancel } from 'redux-saga/effects';

// Ours
import { Request } from './utils/request';
import { Resolver, HandlerFunc } from './utils/resolver';
import { Response, Failure, ClientEvent } from './utils/events';

export type Config = {
	resolver: Resolver;
};

export function* fetch(req: Request, func: HandlerFunc) {
	try {
		const result = yield call(func);
		return yield put(Response(req, result));
	} catch (error) {
		return yield put(Failure(req, error));
	}
}

export function* main(config: Config) {
	const pattern: ClientEvent['type'][] = ['@fetch', '@abort'];
	const channel = yield actionChannel(pattern);

	// Keep a record of ongoing requests
	const ongoing = new Map<string, Task>();

	while (true) {
		const cmd: ClientEvent = yield take(channel);
		const { req } = cmd.payload;

		let task = ongoing.get(req.id);

		// Deduplicate or cancel pending requests
		if (task?.isRunning()) {
			if (cmd.type === '@abort') {
				yield cancel(task);
				ongoing.delete(req.id);
			}

			continue;
		}

		// Either we didn't recognize the request or it has already
		// completed.
		if (cmd.type === '@abort') {
			continue;
		}

		const handler = yield call(config.resolver, req);

		// Run and keep track
		task = yield fork(fetch, req, handler);
		ongoing.set(req.id, task);
	}
}
