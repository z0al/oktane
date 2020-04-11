// Packages
import * as RxObservable from 'rxjs';
import ZenObservable from 'zen-observable';

// Ours
import {
	from,
	fromPromise,
	fromObservable,
	fromCallback,
	Stream,
	subscribe,
} from './streams';

const ERROR = new Error('runtime');

const observe = async (
	stream: any,
	values: any[],
	error: any = 'SHOULD_NOT_THROW'
) => {
	const vals: any[] = [];

	let isClosed: any;
	const toPromise = (stream: Stream) =>
		new Promise((resolve, reject) => {
			isClosed = subscribe(stream, {
				next: (v: any) => vals.push(v),
				error: reject,
				complete: (v: any) => {
					if (v) {
						vals.push(v);
					}
					resolve(vals);
				},
			}).isClosed;

			const pull = () =>
				stream.next().then(() => {
					if (!isClosed()) {
						pull();
					}
				});

			if (stream.lazy) {
				pull();
			}
		});

	try {
		await toPromise(stream);
	} catch (e) {
		expect(isClosed()).toEqual(true);
		expect(e).toEqual(error);
	}

	expect(isClosed()).toEqual(true);
	expect(vals).toEqual(values);
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

		await observe(fromObservable(rx), [1], ERROR);
		await observe(fromObservable(zen), [1], ERROR);
	});
});

describe('fromCallback', () => {
	it('should convert into a lazy stream', () => {
		const fn = jest.fn();
		const stream = fromCallback(fn);

		expect(stream.lazy).toEqual(true);
		expect(stream.next).toEqual(expect.any(Function));
	});

	it('should emit values on stream.next()', async () => {
		const gen = (function*() {
			yield 1;
			yield 2;
			yield 3;
		})();

		const fn = () => gen.next().value;

		await observe(fromCallback(fn), [1, 2, 3]);
	});

	it('should complete if received undefined or nulll', async () => {
		let gen = (function*() {
			yield 1;
			yield 2;
			yield null;
			yield 3;
		})();

		const fn = () => gen.next().value;

		await observe(fromCallback(fn), [1, 2]);

		// ignores => 3
		gen.next();

		await observe(fromCallback(fn), []);
	});
});

describe('from', () => {
	it('should work with callbacks', async () => {
		// success
		let called = false;
		let fn: any = () => {
			if (!called) {
				called = true;
				return { ok: true };
			}
			return null;
		};

		await observe(from(fn), [{ ok: true }]);

		// failure
		const error = new Error('unknown');
		fn = () => Promise.reject(error);

		await observe(from(fn), [], error);
	});

	it('should work with promises', async () => {
		// success
		let p = Promise.resolve(1);
		await observe(from(p), [1]);

		// failure
		const error = new Error('unknown');
		p = Promise.reject(error);
		await observe(from(p), [], error);
	});

	it('should work with observables', async () => {
		// success
		let o: any = ZenObservable.from([1, 2]);
		await observe(from(o), [1, 2]);

		// failure
		const error = new Error('unknown');
		o = new RxObservable.Observable(s => {
			setTimeout(() => {
				s.error(error);
			});
		});

		await observe(from(o), [], error);
	});

	it('should fallback to basic one-time value', async () => {
		// success
		let v: any = { ok: true };
		await observe(from(v), [{ ok: true }]);

		// failure
		// Not applicable
	});
});
