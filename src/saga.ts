// Packages
import { actionChannel, take, call, spawn } from 'redux-saga/effects';

// Ours
import fetch from './fetch';
import { Resolver } from './utils/resolver';
import { EventType, RequestEvent } from './utils/events';

type Config = {
	resolver: Resolver;
};

function* saga(config: Config) {
	const type: EventType = '@fetch';
	const stream = yield actionChannel(type);

	while (true) {
		const { data }: RequestEvent = yield take(stream);

		const fn = yield call(config.resolver, data.req);
		yield spawn(fetch, data.req, fn);
	}
}

export default saga;
