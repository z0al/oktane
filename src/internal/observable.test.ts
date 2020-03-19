// Packages
import * as RxObservable from 'rxjs';
import ZenObservable from 'zen-observable';

// Ours
import Observable from './observable';

const createObserver = (
	t: (next: any, error: any) => void,
	done: any
) => {
	const next = jest.fn();
	const complete = () => {
		t(next, error);
		done();
	};

	const error = jest.fn().mockImplementation(complete);

	return { next, error, complete };
};

describe('Observable.from', () => {
	describe('promises', () => {
		test('should pass resolved value to .next', done => {
			const p = Promise.resolve({ ok: true });

			Observable.from(p).subscribe(
				createObserver((next, error) => {
					expect(next).toBeCalledWith({ ok: true });
					expect(next).toBeCalledTimes(1);
					expect(error).not.toBeCalled();
				}, done)
			);
		});

		test('should pass errors to .error', done => {
			const p = Promise.reject({ ok: false });

			Observable.from(p).subscribe(
				createObserver((next, error) => {
					expect(error).toBeCalledWith({ ok: false });
					expect(error).toBeCalledTimes(1);
					expect(next).not.toBeCalled();
				}, done)
			);
		});
	});

	describe('iterables', () => {
		test('should NOT iterate over iterables', done => {
			const it = [1, 2, 3];

			Observable.from(it).subscribe(
				createObserver((next, error) => {
					expect(next).toBeCalledWith(it);
					expect(next).toBeCalledTimes(1);
					expect(error).not.toBeCalled();
				}, done)
			);
		});

		test('should iterate over async iterables', done => {
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

			Observable.from(it).subscribe(
				createObserver((next, error) => {
					expect(next).toBeCalledWith(1);
					expect(next).toBeCalledWith(2);
					expect(next).toBeCalledWith(3);
					expect(next).toBeCalledTimes(3);
					expect(error).not.toBeCalled();
				}, done)
			);
		});
	});

	describe('generators', () => {
		test('should iterate over generators', done => {
			const it = function*() {
				yield 1;
				yield 2;
				yield 3;
			};

			Observable.from(it()).subscribe(
				createObserver((next, error) => {
					expect(next).toBeCalledWith(1);
					expect(next).toBeCalledWith(2);
					expect(next).toBeCalledWith(3);
					expect(next).toBeCalledTimes(3);
					expect(error).not.toBeCalled();
				}, done)
			);
		});

		test('should iterate over async generators', done => {
			const it = async function*() {
				yield await Promise.resolve(1);
				yield await Promise.resolve(2);
				yield await Promise.resolve(3);
			};

			Observable.from(it()).subscribe(
				createObserver((next, error) => {
					expect(next).toBeCalledWith(1);
					expect(next).toBeCalledWith(2);
					expect(next).toBeCalledWith(3);
					expect(next).toBeCalledTimes(3);
					expect(error).not.toBeCalled();
				}, done)
			);
		});
	});

	describe('observables', () => {
		test('should work with RxJS Observables', done => {
			const o = RxObservable.from([1, 2, 3]);

			Observable.from(o).subscribe(
				createObserver((next, error) => {
					expect(next).toBeCalledWith(1);
					expect(next).toBeCalledWith(2);
					expect(next).toBeCalledWith(3);
					expect(next).toBeCalledTimes(3);
					expect(error).not.toBeCalled();
				}, done)
			);
		});

		test('should work with zen-observable', done => {
			const o = ZenObservable.from([1, 2, 3]);

			Observable.from(o).subscribe(
				createObserver((next, error) => {
					expect(next).toBeCalledWith(1);
					expect(next).toBeCalledWith(2);
					expect(next).toBeCalledWith(3);
					expect(next).toBeCalledTimes(3);
					expect(error).not.toBeCalled();
				}, done)
			);
		});
	});
});
