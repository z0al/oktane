// Packages
import * as RxObservable from 'rxjs';
import ZenObservable from 'zen-observable';

// Ours
import {
	from,
	fromPromise,
	fromObservable,
	fromCallback,
} from './streams';
import { observe } from '../test-utils/observe';

const ERROR = new Error('unknown');

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
		const fn = jest
			.fn()
			.mockReturnValueOnce(1)
			.mockReturnValueOnce(2)
			.mockReturnValueOnce(3);

		await observe(fromCallback(fn), [1, 2, 3]);
	});

	it('should complete if received undefined or null', async () => {
		let fn = jest.fn();
		await observe(fromCallback(fn), []);

		fn = jest
			.fn()
			.mockReturnValueOnce(1)
			.mockReturnValueOnce(2)
			.mockReturnValueOnce(null);
		await observe(fromCallback(fn), [1, 2]);

		fn = jest.fn().mockReturnValueOnce(3);
		await observe(fromCallback(fn), [3]);
	});

	it('should catch errors', async () => {
		const fn = jest
			.fn()
			.mockResolvedValueOnce(1)
			.mockRejectedValueOnce(ERROR);

		await observe(fromCallback(fn), [1], ERROR);
	});
});

describe('from', () => {
	it('should work with callbacks', async () => {
		let fn = jest
			.fn()
			.mockResolvedValueOnce({ ok: true })
			.mockResolvedValueOnce(null);

		await observe(from(fn), [{ ok: true }]);

		fn = jest.fn().mockRejectedValueOnce(ERROR);
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
