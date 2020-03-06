// Packages
import { END } from 'redux-saga';
import { put, take } from 'redux-saga/effects';
import { Observable } from 'zen-observable-ts';
import { expectSaga } from 'redux-saga-test-plan';

// Ours
import { createRequest } from './utils/request';
import { isStreamable, streamChannel } from './streams';

describe('isStreamable', () => {
	test('should accept (async) generators & observables', () => {
		expect(isStreamable((function*() {})())).toBeTruthy();
		expect(isStreamable((async function*() {})())).toBeTruthy();

		expect(isStreamable(Observable.from([]))).toBeTruthy();
	});

	test('should not accept or throw otherwise', () => {
		expect(() => {
			expect(isStreamable(undefined)).toBeFalsy();
			expect(isStreamable(null)).toBeFalsy();
			expect(isStreamable(false)).toBeFalsy();
			expect(isStreamable(true)).toBeFalsy();
			expect(isStreamable(Promise.resolve())).toBeFalsy();
		}).not.toThrowError();
	});
});

describe('streamChannel', () => {
	const req = createRequest({
		type: 'query',
		query: 'test',
	});

	const saga = function*(s: any) {
		const channel = streamChannel(s, req);
		try {
			while (true) {
				yield put(yield take(channel));
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

	test('should consume observable-like objects', () => {
		return expectSaga(saga, Observable.of(1, 2))
			.put(dataEvent(1))
			.put(dataEvent(2))
			.put(END)
			.silentRun();
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
