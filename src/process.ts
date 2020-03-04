// Packages
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
	const type: EventType = '@fetch';
	const stream = yield effects.actionChannel(type);

	while (true) {
		const { data }: RequestEvent = yield effects.take(stream);

		const fn = yield effects.call(config.resolver, data.req);
		yield effects.spawn(fetch, data.req, fn);
	}
}
