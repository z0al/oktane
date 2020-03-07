// Packages
import { END } from 'redux-saga';
import { Observable } from 'zen-observable-ts';
import { expectSaga } from 'redux-saga-test-plan';
import { put, take, race, delay } from 'redux-saga/effects';
import delayP from '@redux-saga/delay-p';

// Ours
import { createRequest } from './utils/request';
import { isStream, streamChannel } from './stream';

describe('isStream', () => {
	test('should accept (async) generators & observables', () => {
		expect(isStream((function*() {})())).toBe(true);
		expect(isStream((async function*() {})())).toBe(true);

		expect(isStream(Observable.from([]))).toBe(true);
	});

	test('should not accept or throw otherwise', () => {
		expect(() => {
			expect(isStream(undefined)).toBeFalsy();
			expect(isStream(null)).toBeFalsy();
			expect(isStream(false)).toBeFalsy();
			expect(isStream(true)).toBeFalsy();
			expect(isStream(Promise.resolve())).toBeFalsy();
		}).not.toThrowError();
	});
});

describe('streamChannel', () => {
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
			// We should get here if we call .emit(END) inside
			// eventChannel
			yield put(END);
		}
	};

	const dataEvent = (data: any) => ({
		type: '@data',
		payload: { res: { request: req, data } },
	});

	const errorEvent = (error: any) => ({
		type: '@failed',
		payload: { error, req },
	});

	test('should consume (async) generators', () => {
		const gen = function*() {
			yield 1;
			yield 2;
		};

		const asyncGen = async function*() {
			yield await Promise.resolve(1);
			yield 2;
		};

		return expectSaga(saga, gen())
			.put(dataEvent(1))
			.put(dataEvent(2))
			.put(END)
			.silentRun()
			.finally(() => {
				return expectSaga(saga, asyncGen())
					.put(dataEvent(1))
					.put(dataEvent(2))
					.put(END)
					.silentRun();
			});
	});

	test.only('should cancel (async) generators on abort', () => {
		const gen = async function*() {
			yield 1;
			yield 2;
			await delayP(150);
			yield 3;
		};

		const g = gen();

		return expectSaga(saga, g, 50)
			.put(dataEvent(1))
			.put(dataEvent(2))
			.not.put(dataEvent(3))
			.put(END)
			.silentRun();
	});

	test('should consume observable-like objects', () => {
		return expectSaga(saga, Observable.of(1, 2))
			.put(dataEvent(1))
			.put(dataEvent(2))
			.put(END)
			.silentRun();
	});

	test('should cancel observable subscription on abort', () => {
		let closed = false;

		const ob = new Observable(o => {
			o.next(1);
			const timeout = setTimeout(() => o.next(2), 150);

			return () => {
				clearTimeout(timeout);
				closed = true;
			};
		});

		return expectSaga(saga, ob, 100)
			.put(dataEvent(1))
			.not.put(dataEvent(2))
			.put(END)
			.silentRun()
			.finally(() => {
				expect(closed).toBe(true);
			});
	});

	test('should catch errors and return @failed', () => {
		const error = new Error('FAIL');
		const gen = async function*() {
			yield 1;
			throw error;
		};

		const observable = new Observable(o => {
			o.next(1);
			o.error(error);
		});

		return expectSaga(saga, gen())
			.put(dataEvent(1))
			.put(errorEvent(error))
			.put(END)
			.silentRun()
			.finally(() => {
				return expectSaga(saga, observable)
					.put(dataEvent(1))
					.put(errorEvent(error))
					.put(END)
					.silentRun();
			});
	});
});
