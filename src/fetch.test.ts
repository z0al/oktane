// Packages
import delay from 'delay';

// Ours
import { pipe } from './utils/pipe';
import { createFetch } from './fetch';
import { createRequest } from './request';
import { ExchangeOptions } from './utils/types';
import {
	$buffer,
	$complete,
	$cancel,
	$reject,
	$fetch,
} from './utils/operations';

const query = createRequest({ type: 'query' });
const mutation = createRequest({ type: 'mutation' });
const stream = createRequest({ type: 'stream' });

let options: ExchangeOptions;
beforeEach(() => {
	options = {
		emit: jest.fn(),
	};
});

test('should return a valid exchange', () => {
	const hanlder = jest.fn();
	const fetch = createFetch(hanlder);

	expect(() => {
		pipe([fetch], options);
	}).not.toThrow();

	expect(fetch.name).toEqual('fetch');
});

test('should only call handler on "fetch" operation', () => {
	const handler = jest.fn();
	const fetch = createFetch(handler);
	const apply = pipe([fetch], options);

	apply($buffer(query, null));
	expect(handler).not.toBeCalled();

	apply($cancel(query));
	expect(handler).not.toBeCalled();

	apply($complete(query));
	expect(handler).not.toBeCalled();

	apply($reject(query, null));
	expect(handler).not.toBeCalled();

	apply($fetch(query));
	expect(handler).toBeCalledTimes(1);
});

test('should not duplicate requests', () => {
	const handler = jest.fn().mockReturnValue(delay(300));
	const fetch = createFetch(handler);
	const apply = pipe([fetch], options);

	apply($fetch(query));
	apply($fetch(query));
	apply($fetch(query));
	apply($fetch(query));
	expect(handler).toBeCalledTimes(1);

	apply($cancel(query));
	apply($fetch(query));
	expect(handler).toBeCalledTimes(2);
});

test('should emit result(s)', async () => {
	const data = { pass: true };
	const handler = () => Promise.resolve(data);
	const fetch = createFetch(handler);
	const apply = pipe([fetch], options);

	// Query
	apply($fetch(query));
	await delay(1);

	expect(options.emit).toBeCalledWith($fetch(query));
	expect(options.emit).toBeCalledWith($complete(query, data));

	// Mutation
	apply($fetch(mutation));
	await delay(1);

	expect(options.emit).toBeCalledWith($fetch(mutation));
	expect(options.emit).toBeCalledWith($complete(mutation, data));

	// Stream
	apply($fetch(stream));
	await delay(1);

	expect(options.emit).toBeCalledWith($fetch(stream));
	expect(options.emit).toBeCalledWith($buffer(stream, data));
	expect(options.emit).toBeCalledWith($complete(stream));
});

test('should handle errors', async () => {
	const error = { fail: true };
	const handler = () => Promise.reject(error);
	const fetch = createFetch(handler);
	const apply = pipe([fetch], options);

	// Query
	apply($fetch(query));
	await delay(1);

	expect(options.emit).toBeCalledWith($reject(query, error));

	// Mutation
	apply($fetch(mutation));
	await delay(1);

	expect(options.emit).toBeCalledWith($reject(mutation, error));

	// Stream
	apply($fetch(stream));
	await delay(1);

	expect(options.emit).toBeCalledWith($reject(stream, error));
	expect(options.emit).toBeCalledTimes(6);
});
