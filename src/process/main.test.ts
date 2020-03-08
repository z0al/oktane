// Packages
import delay from '@redux-saga/delay-p';
import { expectSaga } from 'redux-saga-test-plan';

// Ours
import { main } from './main';
import { fetch } from './fetch';
import { Fetch, Abort } from '../utils/events';
import { createRequest } from '../utils/request';

const request = createRequest({
	type: 'query',
	query: 'test',
});

const FETCH = Fetch(request);
const ABORT = Abort(request);

test('should listen to @fetch & @abort events', () => {
	const config: any = {};
	return expectSaga(main, config)
		.actionChannel(['@fetch', '@abort'])
		.silentRun();
});

test('should call the resolver with the request', () => {
	const config: any = { resolver: () => {} };
	return expectSaga(main, config)
		.call(config.resolver, FETCH.payload.req)
		.dispatch(FETCH)
		.silentRun();
});

test('should fork a fetch call', () => {
	const handler = () => {};
	const config = { resolver: () => handler };

	return expectSaga(main, config)
		.fork(fetch, FETCH.payload.req, handler)
		.dispatch(FETCH)
		.silentRun();
});

test('should deduplicate pending requests', () => {
	const handler = () => delay(100);
	const config = { resolver: () => handler };

	return expectSaga(main, config)
		.fork(fetch, FETCH.payload.req, handler)
		.not.fork(fetch, FETCH.payload.req, handler)
		.dispatch(FETCH)
		.dispatch(FETCH)
		.silentRun();
});

test('should cancel pending requests on abort events', () => {
	const handler = () => delay(100);
	const config = { resolver: () => handler };

	return expectSaga(main, config)
		.fork(fetch, FETCH.payload.req, handler)
		.fork(fetch, FETCH.payload.req, handler)
		.dispatch(FETCH)
		.dispatch(ABORT)
		.dispatch(FETCH)
		.silentRun();
});

test('should do nothing if no pending requests to abort', () => {
	const handler = () => {};
	const config = { resolver: () => handler };

	return expectSaga(main, config)
		.not.call(config.resolver, ABORT.payload.req)
		.not.fork(fetch, ABORT.payload.req, handler)
		.dispatch(ABORT)
		.silentRun();
});
