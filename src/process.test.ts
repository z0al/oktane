// Packages
import delayP from '@redux-saga/delay-p';
import { expectSaga } from 'redux-saga-test-plan';
import { cancelled, call } from 'redux-saga/effects';

// Ours
import { main, fetch } from './process';
import { createRequest } from './utils/request';
import { Fetch, Abort, Fail, Respond } from './utils/events';

describe('main', () => {
	const request = createRequest({
		id: '1',
		type: 'query',
		query: 'test',
	});

	const FETCH = Fetch(request);
	const ABORT = Abort(request);

	let config: any, resolver: any, handler: any;
	beforeEach(() => {
		handler = jest.fn().mockReturnValue(delayP(100, { ok: true }));
		resolver = jest.fn().mockResolvedValue(handler);

		config = { resolver };
	});

	test('should listen to @fetch & @abort events', () => {
		return expectSaga(main, config)
			.actionChannel(['@fetch', '@abort'])
			.silentRun();
	});

	test('should call the resolver with the request', () => {
		return expectSaga(main, config)
			.call(config.resolver, FETCH.payload.req)
			.dispatch(FETCH)
			.silentRun();
	});

	test('should fork a fetch call', () => {
		return expectSaga(main, config)
			.fork(fetch, FETCH.payload.req, handler)
			.dispatch(FETCH)
			.silentRun();
	});

	test('should deduplicate pending requests', () => {
		return expectSaga(main, config)
			.fork(fetch, FETCH.payload.req, handler)
			.not.fork(fetch, FETCH.payload.req, handler)
			.dispatch(FETCH)
			.dispatch(FETCH)
			.silentRun();
	});

	test('should cancel pending requests on abort events', () => {
		let aborted = false;
		handler.mockImplementation(function*() {
			try {
				yield call(handler);
			} finally {
				if (yield cancelled()) {
					aborted = true;
				}
			}
		});

		return expectSaga(main, config)
			.fork(fetch, FETCH.payload.req, handler)
			.dispatch(FETCH)
			.dispatch(ABORT)
			.silentRun()
			.finally(() => {
				expect(aborted).toBe(true);
			});
	});

	test('should do nothing if no pending requests to abort', () => {
		return expectSaga(main, config)
			.not.call(resolver, ABORT.payload.req)
			.not.fork(fetch, ABORT.payload.req, handler)
			.dispatch(ABORT)
			.silentRun();
	});
});

describe('fetch', () => {
	const users = [{ name: 'A' }, { name: 'B' }];
	const request = createRequest({
		type: 'query',
		query: 'test',
	});

	let handler: any;

	beforeEach(() => {
		handler = jest
			.fn()
			.mockResolvedValue([{ name: 'A' }, { name: 'B' }]);
	});

	test('should catch errors', () => {
		const error = new Error('runtime error');
		const event = Fail(request, error);
		handler = jest.fn().mockRejectedValue(error);

		return expectSaga(fetch, request, handler)
			.put(event)
			.silentRun();
	});

	test('should emit data on success', () => {
		const event = Respond(request, users);

		return expectSaga(fetch, request, handler)
			.put(event)
			.silentRun();
	});
});
