// Packages
import { channel } from 'redux-saga';
import * as effects from 'redux-saga/effects';

// Ours
import { main, fetch } from './process';
import { createRequest } from './utils/request';

describe('main', () => {
	let config: any, _channel: any;

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

	// const ABORT: any = {
	// 	type: '@abort',
	// 	data: {
	// 		req: { id: '1' },
	// 	},
	// };

	beforeEach(() => {
		config = { resolver: jest.fn() };
		_channel = channel();
	});

	test('should listen to fetch & abort events', () => {
		const itr = main(config);

		// Steps
		// 1. create a channel
		expect(itr.next().value).toEqual(
			effects.actionChannel(['@fetch', '@abort'])
		);
		// 2. listen for events
		expect(itr.next(_channel).value).toEqual(effects.take(_channel));
	});

	test('should call the resolver with the request', () => {
		const itr = main(config);

		// Steps
		// 1. create a channel
		itr.next();
		// 2. listen for events
		itr.next(_channel);
		// 3. Receive an event
		expect(itr.next(FETCH).value).toEqual(
			effects.call(config.resolver, FETCH.data.req)
		);
	});

	test('should fork a fetch call', () => {
		const itr = main(config);
		const fn: any = jest.fn();

		// Steps
		// 1. create a channel
		itr.next();
		// 2. listen for events
		itr.next(_channel);
		// 3. Receive an event
		itr.next(FETCH);
		// 4. Handle the request
		expect(itr.next(fn).value).toEqual(
			effects.fork(fetch, FETCH.data.req, fn)
		);
	});

	test('should deduplicate pending requests', () => {
		const itr = main(config);
		const fn: any = jest.fn();

		// Workflow
		// create a channel
		itr.next();
		// listen for events
		itr.next(_channel);

		// Round (1)
		itr.next(FETCH);
		expect(itr.next(fn).value).toEqual(
			effects.fork(fetch, FETCH.data.req, fn)
		);

		// Round (2)
		expect(itr.next(FETCH).value).toEqual(effects.take(_channel));
	});
});

describe('fetch', () => {
	const req = createRequest({
		type: 'query',
		query: 'test',
	});

	test('should catch errors', () => {
		const error = new Error('runtime error');
		const fn = jest.fn();

		const itr = fetch(req, fn);
		itr.next();

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

		expect(itr.throw(error).value).toEqual(effects.put(event));
	});

	test('should emit data on success', () => {
		const fn = jest.fn();
		const users = [{ name: 'A' }, { name: 'B' }];

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

		const itr = fetch(req, fn);
		expect(itr.next().value).toEqual(effects.call(fn));
		expect(itr.next(users).value).toEqual(effects.put(event));
	});
});
