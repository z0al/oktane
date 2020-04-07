// Packages
import * as RxObservable from 'rxjs';
import ZenObservable from 'zen-observable';

// Ours
import {
	fromAny,
	fromPromise,
	fromObservable,
	fromCallback,
	Source,
	subscribe,
} from './streams';

const ERROR = new Error('runtime');

const observe = async (
	source: any,
	values: any[],
	error: any = 'SHOULD_NOT_THROW'
) => {
	const vals: any[] = [];

	let isClosed: any;
	const toPromise = (source: Source) =>
		new Promise((resolve, reject) => {
			isClosed = subscribe(source, {
				next: (v: any) => vals.push(v),
				error: reject,
				complete: () => resolve(vals),
			}).isClosed;

			const pull = () =>
				source.next().then(() => {
					if (!isClosed()) {
						pull();
					}
				});

			if (source.lazy) {
				pull();
			}
		});

	try {
		await toPromise(source);
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
	it('should convert into a pullable source', () => {
		const fn = jest.fn();
		expect(fromCallback(fn)).toEqual(
			expect.objectContaining({
				lazy: true,
				next: expect.any(Function),
			})
		);
	});

	it('should emit values on source.next()', async () => {
		const fn = jest
			.fn()
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(2)
			.mockResolvedValueOnce(3);

		await observe(fromCallback(fn), [1, 2, 3]);
	});

	it('should complete if received undefined or nulll', async () => {
		const fn1 = jest
			.fn()
			.mockResolvedValueOnce(1)
			.mockResolvedValue(null);

		const fn2 = jest
			.fn()
			.mockResolvedValueOnce(2)
			.mockResolvedValue(undefined);

		await observe(fromCallback(fn1), [1]);
		await observe(fromCallback(fn2), [2]);
	});
});

describe('fromAny', () => {
	it('should work with lazy sources/callbacks', async () => {
		// values
		let fn = jest
			.fn()
			.mockReturnValueOnce({ ok: true })
			.mockReturnValue(null);

		await observe(fromAny(fn), [{ ok: true }]);

		// errors
		fn = jest.fn().mockRejectedValue({ error: true });
		await observe(fromAny(fn), [], { error: true });
	});

	it('should work with promises', async () => {
		// values
		let p = Promise.resolve(1);
		await observe(fromAny(p), [1]);

		// errors
		p = Promise.reject({ error: true });
		await observe(fromAny(p), [], { error: true });
	});

	it('should work with observables', async () => {
		// values
		let o: any = ZenObservable.from([1, 2]);
		await observe(fromAny(o), [1, 2]);

		// errors
		o = new RxObservable.Observable(s => {
			setTimeout(() => {
				s.error({ error: true });
			});
		});

		await observe(fromAny(o), [], { error: true });
	});

	it('should fallback to basic one-time value', async () => {
		// values
		let v: any = { ok: true };
		await observe(fromAny(v), [{ ok: true }]);

		// errors are not applicable
	});
});
