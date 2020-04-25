// Packages
import * as RxObservable from 'rxjs';
import ZenObservable from 'zen-observable';

// Ours
import { subscribe, Source } from './sources';

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
		// convert a subscription to Promise that resolves when the
		// subscription completes.
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

			const subscription = subscribe(source, subscriber);

			isClosed = subscription.isClosed;

			const pull = () =>
				subscription.next().then(() => {
					if (!isClosed()) {
						pull();
					}
				});

			if (subscription.lazy) {
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

describe('With Promises', () => {
	it('should pass resolved value to .next', async () => {
		const result = { ok: true };
		const p = Promise.resolve(result);
		await observe(p, [result]);
	});

	it('should pass errors to .error', async () => {
		const error = { ok: false };
		const p = Promise.reject(error);
		await observe(p, [], error);
	});
});

describe('With Observable-like', () => {
	const fromObservable = (observable: any) => (observer: any) => {
		return observable.subscribe(observer).unsubscribe;
	};

	it('should work with RxJS Observables', async () => {
		const source = fromObservable(RxObservable.of(1, 2, 3, 4));

		await observe(source, [1, 2, 3, 4]);
	});

	it('should work with zen-observable', async () => {
		const source = fromObservable(ZenObservable.of(1, 2, 3, 4));

		await observe(source, [1, 2, 3, 4]);
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

describe('With (Async) Iterables', () => {
	it('should mark it as lazy source', () => {
		const subscription = subscribe([1, 2], {
			complete: jest.fn(),
			error: jest.fn(),
			next: jest.fn(),
		});

		expect(subscription.lazy).toEqual(true);
		expect(subscription.next).toEqual(expect.any(Function));
	});

	it('should emit values on subscription.next()', async () => {
		const gen = (function*() {
			yield 1;
			yield 2;
			yield 3;
		})();

		await observe(gen, [1, 2, 3]);
	});

	it('should catch errors', async () => {
		// eslint-disable-next-line
		const gen = (function*() {
			throw ERROR;
		})();

		await observe(gen, [], ERROR);
	});
});

describe('With other values', () => {
	it('should wrap them in a Promise', async () => {
		await observe(1, [1]);
		await observe(true, [true]);
		await observe({}, [{}]);
	});
});
