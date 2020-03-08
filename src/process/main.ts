// Packages
import { Task } from 'redux-saga';
import { actionChannel } from 'redux-saga/effects';
import { take, call, fork, cancel } from 'redux-saga/effects';

// Ours
import { fetch } from './fetch';
import { Resolver } from '../utils/resolver';
import { ClientEvent } from '../utils/events';

export type Config = {
	resolver: Resolver;
};

export function* main(config: Config) {
	const channel = yield actionChannel(['@fetch', '@cancel']);

	// Keep a record of ongoing requests
	const ongoing = new Map<string, Task>();

	while (true) {
		const cmd: ClientEvent = yield take(channel);
		const { req } = cmd.payload;

		let task = ongoing.get(req.id);

		// Deduplicate or cancel pending requests
		if (task?.isRunning()) {
			if (cmd.type === '@cancel') {
				yield cancel(task);
				ongoing.delete(req.id);
			}

			continue;
		}

		// Either we didn't recognize the request or it has already
		// completed.
		if (cmd.type === '@cancel') {
			continue;
		}

		const handler = yield call(config.resolver, req);

		// Run and keep track
		task = yield fork(fetch, req, handler);
		ongoing.set(req.id, task);
	}
}
