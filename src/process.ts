// Packages
import { Task } from 'redux-saga';
import * as effects from 'redux-saga/effects';

// Ours
import { Request } from './utils/request';
import { Resolver, ResolverFn } from './utils/resolver';
import { Event, EventType, RequestEvent } from './utils/events';

type Config = {
	resolver: Resolver;
};

export function* fetch(req: Request, resolve: ResolverFn) {
	try {
		const result = yield effects.call(resolve);

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

		return yield effects.put(success);
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

		return yield effects.put(failed);
	}
}

export function* main(config: Config) {
	const events: EventType[] = ['@fetch', '@abort'];
	const channel = yield effects.actionChannel(events);

	// Keep a list of ongoing requests
	const ongoing = new Map<string, Task>();

	while (true) {
		const event: RequestEvent = yield effects.take(channel);
		const { req } = event.data;

		// Deduplicate pending requests
		let task = ongoing.get(req.id);
		if (task?.isRunning()) {
			continue;
		}

		const handler = yield effects.call(config.resolver, req);

		// Run and keep track
		task = yield effects.fork(fetch, req, handler);
		ongoing.set(req.id, task);
	}
}
