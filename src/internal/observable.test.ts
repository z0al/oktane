// Packages
import * as RxObservable from 'rxjs';
import ZenObservable from 'zen-observable';

// Ours
import Observable from './observable';
import { expectObservable } from './test/helpers';

describe('Observable.from', () => {
	const ERROR = new Error('runtime');

	describe('promises', () => {
		test('should pass resolved value to .next', async () => {
			const result = { ok: true };
			const p = Promise.resolve(result);
			await expectObservable(Observable.from(p), [result]);
		});

		test('should pass errors to .error', async () => {
			const error = { ok: false };
			const p = Promise.reject(error);
			await expectObservable(Observable.from(p), [], error);
		});
	});

	describe('iterables', () => {
		test('should NOT iterate over iterables', async () => {
			const it = [1, 2, 3];
			await expectObservable(Observable.from(it), [it]);
		});

		test('should iterate over async iterables', async () => {
			const it = {
				[Symbol.asyncIterator]: () => {
					const max = 3;
					let current = 0;

					return {
						async next() {
							if (current < max) {
								return { value: ++current, done: false };
							} else {
								return { done: true };
							}
						},
					};
				},
			};

			await expectObservable(Observable.from(it), [1, 2, 3]);
		});
	});

	describe('generators', () => {
		test('should iterate over generators', async () => {
			const it = function*() {
				yield 1;
				yield 2;
				yield 3;
			};

			await expectObservable(Observable.from(it()), [1, 2, 3]);
		});

		test('should iterate over async generators', async () => {
			const itAsync = async function*() {
				yield await Promise.resolve(1);
				yield await Promise.resolve(2);
				yield await Promise.resolve(3);
			};

			await expectObservable(Observable.from(itAsync()), [1, 2, 3]);
		});

		test('should catch thrown errors', async () => {
			const it = function*() {
				yield 1;
				throw ERROR;
			};

			const itAsync = async function*() {
				yield await Promise.resolve(1);
				throw ERROR;
			};

			await expectObservable(Observable.from(it()), [1], ERROR);
			await expectObservable(Observable.from(itAsync()), [1], ERROR);
		});
	});

	describe('observables', () => {
		test('should work with RxJS Observables', async () => {
			const result = [1, 2, 3];
			await expectObservable(RxObservable.from(result), result);
		});

		test('should work with zen-observable', async () => {
			const result = [1, 2, 3];
			await expectObservable(ZenObservable.from(result), result);
		});

		test('should catch thrown errors', async () => {
			const rx = new RxObservable.Observable(s => {
				s.next(1);
				s.error(ERROR);
				s.next(2);
			});

			const zen = new ZenObservable(s => {
				s.next(1);
				s.error(ERROR);
				s.next(2);
			});

			await expectObservable(rx, [1], ERROR);
			await expectObservable(zen, [1], ERROR);
		});
	});
});
