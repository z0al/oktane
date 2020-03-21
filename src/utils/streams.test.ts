// Packages
import * as RxObservable from 'rxjs';
import ZenObservable from 'zen-observable';

// Ours
import { subscribe, fromStream } from './streams';

const ERROR = new Error('runtime');

const observe = async (
	source: any,
	values: any[],
	error: any = 'SHOULD_NOT_THROW'
) => {
	const vals: any[] = [];

	const toPromise = (source: any) =>
		new Promise((resolve, reject) => {
			subscribe(fromStream(source), {
				next: (v: any) => vals.push(v),
				error: reject,
				complete: () => resolve(vals),
			});
		});

	try {
		await toPromise(source);
	} catch (e) {
		expect(e).toEqual(error);
	}

	expect(vals).toEqual(values);
};

describe('with promises', () => {
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

describe('with iterables', () => {
	it('should NOT iterate over iterables', async () => {
		const it = [1, 2, 3];
		await observe(it, [it]);
	});

	it('should iterate over async iterables', async () => {
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

		await observe(it, [1, 2, 3]);
	});
});

describe('with generators', () => {
	it('should iterate over generators', async () => {
		const it = function*() {
			yield 1;
			yield 2;
			yield 3;
		};

		await observe(it(), [1, 2, 3]);
	});

	it('should iterate over async generators', async () => {
		const itAsync = async function*() {
			yield await Promise.resolve(1);
			yield await Promise.resolve(2);
			yield await Promise.resolve(3);
		};

		await observe(itAsync(), [1, 2, 3]);
	});

	it('should catch thrown errors', async () => {
		const it = function*() {
			yield 1;
			throw ERROR;
		};

		const itAsync = async function*() {
			yield await Promise.resolve(1);
			throw ERROR;
		};

		await observe(it(), [1], ERROR);
		await observe(itAsync(), [1], ERROR);
	});
});

describe('with observables', () => {
	it('should work with RxJS Observables', async () => {
		const result = [1, 2, 3];
		await observe(RxObservable.from(result), result);
	});

	it('should work with zen-observable', async () => {
		const result = [1, 2, 3];
		await observe(ZenObservable.from(result), result);
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

		await observe(rx, [1], ERROR);
		await observe(zen, [1], ERROR);
	});
});
