// Packages
import { END } from 'redux-saga';
import { Observable } from 'zen-observable-ts';
import { expectSaga } from 'redux-saga-test-plan';
import { put, take, race, delay } from 'redux-saga/effects';
import { of as RxOf, Observable as RxObservable } from 'rxjs';
import delayP from '@redux-saga/delay-p';

// Ours
import { streamChannel } from './stream';
import { createRequest } from './utils/request';
import { Response, Failure, Completed } from './utils/events';

const req = createRequest({
	type: 'query',
	query: 'test',
});

const saga = function*(s: any, timeout: number = 0) {
	const channel = streamChannel(s, req);
	try {
		while (true) {
			if (timeout > 0) {
				const { event, canceled } = yield race({
					event: take(channel),
					canceled: delay(timeout),
				});

				if (canceled) {
					channel.close();
					break;
				}

				yield put(event);
			} else {
				yield put(yield take(channel));
			}
		}
	} finally {
		// We should get here when we call .emit(END) inside
		// streamChannel
		yield put(END);
	}
};

test('should consume (async) generators', async () => {
	const gen = function*() {
		yield 1;
		yield 2;
	};

	const asyncGen = async function*() {
		yield await Promise.resolve(1);
		yield 2;
	};

	// Normal generator
	await expectSaga(saga, gen())
		.put(Response(req, 1))
		.put(Response(req, 2))
		.put(Completed(req))
		.put(END)
		.silentRun();

	// Async generator
	return expectSaga(saga, asyncGen())
		.put(Response(req, 1))
		.put(Response(req, 2))
		.put(Completed(req))
		.put(END)
		.silentRun();
});

test('should cancel (async) generators on abort', async () => {
	let cancelled = false;
	const gen = async function*() {
		try {
			yield 1;
			yield 2;
			await delayP(150);
			yield 3;
		} finally {
			// This will be called after `delayP` resolves
			cancelled = true;
		}
	};

	const g = gen();

	await expectSaga(saga, g, 50)
		.put(Response(req, 1))
		.put(Response(req, 2))
		.not.put(Response(req, 3))
		.put(END)
		.silentRun();

	return delayP(150).then(() => {
		expect(cancelled).toBe(true);
	});
});

test('should consume observable-like objects', async () => {
	await expectSaga(saga, Observable.of(1, 2))
		.put(Response(req, 1))
		.put(Response(req, 2))
		.put(Completed(req))
		.put(END)
		.silentRun();

	return expectSaga(saga, RxOf(1, 2))
		.put(Response(req, 1))
		.put(Response(req, 2))
		.put(Completed(req))
		.put(END)
		.silentRun();
});

test('should cancel observable subscription on abort', async () => {
	let cancelled = false;

	const sub = (o: any) => {
		o.next(1);
		const timeout = setTimeout(() => o.next(2), 150);

		return () => {
			clearTimeout(timeout);
			cancelled = true;
		};
	};

	// Zen Observable
	await expectSaga(saga, new Observable(sub), 100)
		.put(Response(req, 1))
		.not.put(Response(req, 2))
		.put(END)
		.silentRun();

	expect(cancelled).toBe(true);

	// RxJS Observable
	cancelled = false;
	await expectSaga(saga, new RxObservable(sub), 100)
		.put(Response(req, 1))
		.not.put(Response(req, 2))
		.put(END)
		.silentRun();

	expect(cancelled).toBe(true);
});

test('should catch errors and return @Faileded', async () => {
	const error = new Error('Failure');
	const gen = async function*() {
		yield 1;
		throw error;
	};

	await expectSaga(saga, gen())
		.put(Response(req, 1))
		.put(Failure(req, error))
		.not.put(Completed(req))
		.put(END)
		.silentRun()
		.finally(() => {});

	const sub = (o: any) => {
		o.next(1);
		o.error(error);
	};

	const ob = new Observable(sub);
	await expectSaga(saga, ob)
		.put(Response(req, 1))
		.put(Failure(req, error))
		.not.put(Completed(req))
		.put(END)
		.silentRun();

	const rx = new Observable(sub);
	return expectSaga(saga, rx)
		.put(Response(req, 1))
		.put(Failure(req, error))
		.not.put(Completed(req))
		.put(END)
		.silentRun();
});
