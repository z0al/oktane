// Packages
import delayP from '@redux-saga/delay-p';
import { expectSaga } from 'redux-saga-test-plan';
import { cancelled, call } from 'redux-saga/effects';

// Ours
import { main, fetch } from './process';
import { createRequest } from './utils/request';
import { RequestEvent, ResponseEvent } from './utils/events';

describe('main', () => {
	let config: any, resolver: any, handler: any;

	const FETCH: RequestEvent = {
		type: '@fetch',
		payload: {
			req: createRequest({
				id: '1',
				type: 'query',
				query: 'test',
			}),
		},
	};

	const ABORT: RequestEvent = {
		type: '@abort',
		payload: {
			req: { id: '1' } as any,
		},
	};

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
	let handler: any;

	beforeEach(() => {
		handler = jest
			.fn()
			.mockResolvedValue([{ name: 'A' }, { name: 'B' }]);
	});

	const req = createRequest({
		type: 'query',
		query: 'test',
	});

	test('should catch errors', () => {
		const error = new Error('runtime error');
		handler = jest.fn().mockRejectedValue(error);

		const event = {
			type: '@failed',
			payload: {
				req: {
					id: req.id,
					type: req.type,
				},
				error,
			},
		};

		return expectSaga(fetch, req, handler)
			.put(event)
			.silentRun();
	});

	test('should emit data on success', () => {
		const event: ResponseEvent = {
			type: '@data',
			payload: {
				res: {
					data: users,
					request: {
						id: req.id,
						type: req.type,
					},
				},
			},
		};

		return expectSaga(fetch, req, handler)
			.put(event)
			.silentRun();
	});
});
