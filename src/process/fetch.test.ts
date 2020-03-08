// Packages
import { Observable } from 'zen-observable-ts';
import { expectSaga } from 'redux-saga-test-plan';

// Ours
import { fetch } from './fetch';
import { createRequest } from '../utils/request';
import { Completed, Failure, Response } from '../utils/events';

const data = { ok: true };
const request = createRequest({
	type: 'query',
	query: 'test',
});

test('should catch errors', () => {
	const error = new Error('runtime error');
	const handler = () => Promise.reject(error);

	return expectSaga(fetch, request, handler)
		.put(Failure(request, error))
		.not.put(Completed(request))
		.silentRun();
});

test('should emit data on success', () => {
	const handler = () => Promise.resolve(data);

	return expectSaga(fetch, request, handler)
		.put(Response(request, data))
		.put(Completed(request))
		.silentRun();
});

test('should handle streams', async () => {
	const gen = async function*() {
		yield 1;
		yield 2;
		yield 3;
	};

	await expectSaga(fetch, request, gen)
		.put(Response(request, 1))
		.put(Response(request, 2))
		.put(Response(request, 3))
		.put(Completed(request))
		.silentRun();

	const o = Observable.from([1, 2, 3]);
	return expectSaga(fetch, request, () => o)
		.put(Response(request, 1))
		.put(Response(request, 2))
		.put(Response(request, 3))
		.put(Completed(request))
		.silentRun();
});
