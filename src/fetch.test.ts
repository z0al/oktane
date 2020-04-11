// Packages
import delay from 'delay';
import * as rx from 'rxjs';
import * as zen from 'zen-observable';

// Ours
import { pipe } from './utils/pipe';
import { createFetch } from './fetch';
import { createRequest } from './request';
import { ExchangeAPI } from './utils/types';
import {
	$buffer,
	$complete,
	$cancel,
	$reject,
	$fetch,
} from './utils/operations';

const query = createRequest({
	_type: 'query',
	url: '/api/posts',
});

const mutation = createRequest({
	_type: 'mutation',
	url: '/api/posts',
});

const stream = createRequest({
	_type: 'stream',
	url: '/api/posts',
});

let api: ExchangeAPI;
beforeEach(() => {
	api = {
		emit: jest.fn(),
		cache: new Map(),
	};
});

test('should return a valid exchange', () => {
	const hanlder = jest.fn();
	const fetch = createFetch(hanlder);

	expect(() => {
		pipe([fetch], api);
	}).not.toThrow();

	expect(fetch.name).toEqual('fetch');
});

test('should only call handler on "fetch" operation', () => {
	const handler = jest.fn();
	const fetch = createFetch(handler);
	const apply = pipe([fetch], api);
	const context = { cache: api.cache };

	apply($buffer(query, null));
	expect(handler).not.toBeCalled();

	apply($cancel(query));
	expect(handler).not.toBeCalled();

	apply($complete(query));
	expect(handler).not.toBeCalled();

	apply($reject(query, null));
	expect(handler).not.toBeCalled();

	apply($fetch(query));
	expect(handler).toBeCalledWith(query, context);
	expect(handler).toBeCalledTimes(1);
});

test('should not duplicate requests', async () => {
	const handler = jest.fn().mockReturnValue(delay(100));
	const fetch = createFetch(handler);
	const apply = pipe([fetch], api);
	const context = { cache: api.cache };

	apply($fetch(query));
	apply($fetch(query));
	apply($fetch(query));
	apply($fetch(query));
	expect(handler).toBeCalledWith(query, context);
	expect(handler).toBeCalledTimes(1);

	apply($cancel(query));
	apply($fetch(query));
	expect(handler).toBeCalledWith(query, context);
	expect(handler).toBeCalledTimes(2);

	// Make sure we can refetch when the request completes
	await delay(150);
	apply($fetch(query));
	expect(handler).toBeCalledTimes(3);
});

test('should emit result(s)', async () => {
	const data = { pass: true };
	const handler = (req: any) => {
		const p = Promise.resolve(data);
		if (req === stream) {
			return rx.from(p);
		}

		return p;
	};

	const fetch = createFetch(handler);
	const apply = pipe([fetch], api);

	// Query
	apply($fetch(query));
	await delay(1);

	expect(api.emit).toBeCalledWith($fetch(query));
	expect(api.emit).toBeCalledWith($complete(query, data));

	// Mutation
	apply($fetch(mutation));
	await delay(1);

	expect(api.emit).toBeCalledWith($fetch(mutation));
	expect(api.emit).toBeCalledWith($complete(mutation, data));

	// Stream
	apply($fetch(stream));
	await delay(1);

	expect(api.emit).toBeCalledWith($fetch(stream));
	expect(api.emit).toBeCalledWith($buffer(stream, data));
	expect(api.emit).toBeCalledWith($complete(stream));
});

test('should handle errors', async () => {
	const error = { fail: true };
	const handler = (req: any) => {
		const p = Promise.reject(error);
		if (req === stream) {
			return rx.from(p);
		}

		return p;
	};

	const fetch = createFetch(handler);
	const apply = pipe([fetch], api);

	// Query
	apply($fetch(query));
	await delay(1);

	expect(api.emit).toBeCalledWith($reject(query, error));

	// Mutation
	apply($fetch(mutation));
	await delay(1);

	expect(api.emit).toBeCalledWith($reject(mutation, error));

	// Stream
	apply($fetch(stream));
	await delay(1);

	expect(api.emit).toBeCalledWith($reject(stream, error));
	expect(api.emit).toBeCalledTimes(6);
});

test('should not emit when cancelled', async () => {
	const handler = jest.fn().mockReturnValue(delay(1));
	const fetch = createFetch(handler);
	const apply = pipe([fetch], api);

	apply($fetch(query));
	apply($cancel(query));
	await delay(50);

	expect(api.emit).toBeCalledWith($fetch(query));
	expect(api.emit).toBeCalledWith($cancel(query));
	expect(api.emit).toBeCalledTimes(2);
});

test('should work with observables', async () => {
	let observer: any = rx.from([1, 2, 3]);
	const handler = jest.fn().mockImplementation(() => observer);
	const fetch = createFetch(handler);
	const apply = pipe([fetch], api);

	apply($fetch(stream));
	await delay(1);

	expect(api.emit).toBeCalledWith($fetch(stream));
	expect(api.emit).toBeCalledWith($buffer(stream, 1));
	expect(api.emit).toBeCalledWith($buffer(stream, 2));
	expect(api.emit).toBeCalledWith($buffer(stream, 3));
	expect(api.emit).toBeCalledWith($complete(stream));
	expect(api.emit).toBeCalledTimes(5);

	observer = zen.default.from([4, 5, 6]);
	apply($fetch(stream));
	await delay(1);

	expect(api.emit).toBeCalledWith($fetch(stream));
	expect(api.emit).toBeCalledWith($buffer(stream, 4));
	expect(api.emit).toBeCalledWith($buffer(stream, 5));
	expect(api.emit).toBeCalledWith($buffer(stream, 6));
	expect(api.emit).toBeCalledWith($complete(stream));
	expect(api.emit).toBeCalledTimes(10);
});
