// Packages
import delayP from '@redux-saga/delay-p';
import { expectSaga } from 'redux-saga-test-plan';

// Ours
import { main, fetch } from './process';
import { createRequest } from './utils/request';

describe('main', () => {
	let config: any, resolver: any, handler: any;

	const FETCH: any = {
		type: '@fetch',
		data: {
			req: createRequest({
				id: '1',
				type: 'query',
				query: 'test',
			}),
		},
	};

	const ABORT: any = {
		type: '@abort',
		data: {
			req: { id: '1' },
		},
	};

	beforeEach(() => {
		handler = jest.fn().mockReturnValue(delayP(150, { ok: true }));
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
			.call(config.resolver, FETCH.data.req)
			.dispatch(FETCH)
			.silentRun();
	});

	test('should fork a fetch call', () => {
		return expectSaga(main, config)
			.fork(fetch, FETCH.data.req, handler)
			.dispatch(FETCH)
			.silentRun();
	});

	test('should deduplicate pending requests', () => {
		return expectSaga(main, config)
			.fork(fetch, FETCH.data.req, handler)
			.not.fork(fetch, FETCH.data.req, handler)
			.dispatch(FETCH)
			.dispatch(FETCH)
			.silentRun();
	});

	test('should cancel pending requests on abort events', () => {
		return expectSaga(main, config)
			.fork(fetch, FETCH.data.req, handler)
			.fork(fetch, FETCH.data.req, handler)
			.dispatch(FETCH)
			.dispatch(ABORT)
			.dispatch(FETCH)
			.silentRun();
	});

	test('should do nothing if no pending requests to abort', () => {
		return expectSaga(main, config)
			.not.call(resolver, ABORT.data.req)
			.not.fork(fetch, ABORT.data.req, handler)
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
			data: {
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
		const event = {
			type: '@data',
			data: {
				res: {
					data: users,
					done: true,
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
