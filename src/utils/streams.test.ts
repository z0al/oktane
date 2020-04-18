// Packages
import * as RxObservable from 'rxjs';
import ZenObservable from 'zen-observable';

// Ours
import {
	from,
	fromPromise,
	fromObservable,
	fromCallback,
	subscribe,
	Source,
} from './streams';

const ERROR = new Error('unknown');

const observe = async (
	source: Source,
	expectedValues: any[],
	expectedError: any = 'SHOULD_NOT_THROW'
) => {
	let isClosed: Function;

	// Emitted values
	const values: any[] = [];

	try {
		// convert a stream to Promise that resolves when the stream
		// completes.
		await new Promise((resolve, reject) => {
			const subscriber = {
				next: (v: any) => values.push(v),
				error: reject,
				complete: (v: any) => {
					if (v) {
						values.push(v);
					}
					resolve(values);
				},
			};

			const stream = subscribe(source, subscriber);

			isClosed = stream.isClosed;

			const pull = () =>
				stream.next().then(() => {
					if (!isClosed()) {
						pull();
					}
				});

			if (source.pull) {
				pull();
			}
		});
	} catch (e) {
		expect(e).toEqual(expectedError);
	} finally {
		expect(isClosed()).toEqual(true);
	}

	expect(values).toEqual(expectedValues);
};

describe('fromPromise', () => {
	it('should pass resolved value to .next', async () => {
		const result = { ok: true };
		const p = Promise.resolve(result);
		await observe(fromPromise(p), [result]);
	});

	it('should pass errors to .error', async () => {
		const error = { ok: false };
		const p = Promise.reject(error);
		await observe(fromPromise(p), [], error);
	});
});

describe('fromObservables', () => {
	it('should work with RxJS Observables', async () => {
		const result = [1, 2, 3];
		await observe(fromObservable(RxObservable.from(result)), result);
	});

	it('should work with zen-observable', async () => {
		const result = [1, 2, 3];
		await observe(fromObservable(ZenObservable.from(result)), result);
	});

	it('should catch thrown errors', async () => {
		const rx = new RxObservable.Observable((s) => {
			s.next(1);
			s.error(ERROR);
			s.next(2);
		});

		const zen = new ZenObservable((s) => {
			s.next(1);
			s.error(ERROR);
			s.next(2);
		});

		await observe(fromObservable(rx), [1], ERROR);
		await observe(fromObservable(zen), [1], ERROR);
	});
});

describe('fromCallback', () => {
	it('should convert into a pull stream', () => {
		const fn = jest.fn();
		const stream = fromCallback(fn);

		expect(stream.pull).toEqual(true);
	});

	it('should emit values on stream.next()', async () => {
		const gen = (function*() {
			yield 1;
			yield 2;
			yield 3;
		})();

		const fn = async () => gen.next();

		await observe(fromCallback(fn), [1, 2, 3]);
	});

	it('should not ignore completion values', async () => {
		const fn = async () => ({ value: 1, done: true });

		await observe(fromCallback(fn), [1]);
	});

	it('should catch errors', async () => {
		const fn = async () => {
			throw ERROR;
		};

		await observe(fromCallback(fn), [], ERROR);
	});
});

describe('from', () => {
	it('should work with callbacks', async () => {
		const gen = (function*() {
			yield 1;
			yield 2;
			yield 3;
		})();

		let fn = async () => gen.next();

		await observe(from(fn), [1, 2, 3]);

		fn = async () => {
			throw ERROR;
		};

		await observe(from(fn), [], ERROR);
	});

	it('should work with promises', async () => {
		// success
		let p = Promise.resolve(1);
		await observe(from(p), [1]);

		// failure
		p = Promise.reject(ERROR);
		await observe(from(p), [], ERROR);
	});

	it('should work with observables', async () => {
		// success
		let o: any = ZenObservable.from([1, 2]);
		await observe(from(o), [1, 2]);

		// failure
		o = new RxObservable.Observable((s) => {
			setTimeout(() => {
				s.error(ERROR);
			});
		});

		await observe(from(o), [], ERROR);
	});

	it('should fallback to basic one-time value', async () => {
		// success
		let v: any = { ok: true };
		await observe(from(v), [{ ok: true }]);

		// failure
		// Not applicable
	});
});
