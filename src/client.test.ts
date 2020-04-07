// Packages
import delay from 'delay';
import Observable from 'zen-observable';

// Ours
import { createClient } from './client';
import { Exchange } from './utils/types';
import { createRequest } from './request';
import {
	$fetch,
	$cancel,
	$dispose,
	$buffer,
	$complete,
} from './utils/operations';

describe('client', () => {
	const query = createRequest({
		type: 'query',
		query: 'test',
		variables: [1, 2],
	});

	const mutation = createRequest({
		type: 'mutation',
		query: 'test',
		variables: [1, 2],
	});

	const stream = createRequest({
		type: 'stream',
		query: 'test',
		variables: [1, 2],
	});

	const logTo = (fn: any): Exchange => ({
		name: 'dummy',
		init: () => next => op => {
			fn(op);
			return next(op);
		},
	});

	it('should expose public interface', () => {
		const client = createClient({ handler: jest.fn() });

		expect(client).toEqual({
			fetch: expect.any(Function),
			prefetch: expect.any(Function),
		});
	});

	it('should not throw when no exchanges were passed', () => {
		expect(() => {
			createClient({} as any);
		}).not.toThrow();

		expect(() => {
			const handler = jest.fn();
			createClient({ handler, exchanges: [] });
			expect(handler).not.toBeCalled();
		}).not.toThrow();
	});

	it('should pass necessary options to exchanges', () => {
		createClient({
			handler: jest.fn(),
			exchanges: [
				{
					name: 'test',
					init: o => {
						expect(o.emit).toBeDefined();
						expect(o.cache).toBeDefined();
						expect(o.cache?.get).toBeDefined();
						expect(o.cache?.has).toBeDefined();
						expect(o.cache?.entries).toBeDefined();
						expect(o.cache?.keys).toBeDefined();
						expect(o.cache?.values).toBeDefined();
						return next => op => next(op);
					},
				},
			],
		});
	});

	it('should pass a readonly cache', () => {
		expect(() => {
			createClient({
				handler: jest.fn(),
				exchanges: [
					{
						name: 'test',
						init: o => {
							(o.cache as any).set('random', 'value');
							return next => op => next(op);
						},
					},
				],
			});
		}).toThrow(/not a function/);

		expect(() => {
			createClient({
				handler: jest.fn(),
				exchanges: [
					{
						name: 'test',
						init: o => {
							(o.cache as any).delete('key');
							return next => op => next(op);
						},
					},
				],
			});
		}).toThrow(/not a function/);

		expect(() => {
			createClient({
				handler: jest.fn(),
				exchanges: [
					{
						name: 'test',
						init: o => {
							(o.cache as any).clear();
							return next => op => next(op);
						},
					},
				],
			});
		}).toThrow(/not a function/);
	});

	it('should dispose inactive queries', async () => {
		const fn = jest.fn();
		const client = createClient({
			handler: jest.fn(),
			gc: { maxAge: 10 },
			exchanges: [logTo(fn)],
		});

		// Without subscriber - immediatly inactive
		client.prefetch(query);
		await delay(15);
		expect(fn).toBeCalledWith(
			$dispose({ id: query.id, type: undefined })
		);

		// With subscriber - wait for .unsubscribe()
		const sub = client.fetch(mutation, jest.fn());
		await delay(15);
		expect(fn).not.toBeCalledWith(
			$dispose({ id: mutation.id, type: undefined })
		);

		sub.unsubscribe();
		await delay(15);
		expect(fn).toBeCalledWith(
			$dispose({ id: mutation.id, type: undefined })
		);

		// Don't dispose if we still have subscribers
		client.fetch(stream);
		client.fetch(stream, jest.fn());
		await delay(15);
		expect(fn).not.toBeCalledWith(
			$dispose({ id: stream.id, type: undefined })
		);
	});

	it('should clear cache on "dispose"', async () => {
		let cacheRef: any;

		const client = createClient({
			handler: jest.fn().mockResolvedValue(null),
			gc: { maxAge: 10 },
			exchanges: [
				{
					name: 'dummy',
					init: ({ cache }) => {
						cacheRef = cache;
						return next => op => {
							next(op);
						};
					},
				},
			],
		});

		// Without subscriber - immediatly inactive
		client.fetch(query);
		await delay(15);

		expect(cacheRef.get(query.id)).toBeUndefined();
	});

	describe('.fetch', () => {
		const data = [{ name: 'A' }, { name: 'B' }];

		let handler: any;
		beforeEach(() => {
			handler = jest.fn().mockResolvedValue(data);
		});

		it('should emit fetch operation', () => {
			const fn = jest.fn();
			const client = createClient({
				handler,
				exchanges: [logTo(fn)],
			});
			client.fetch(query);

			expect(fn).toBeCalledWith($fetch(query));
		});

		it('should not emit "fetch" if it is already pending', () => {
			const fn = jest.fn();
			const client = createClient({
				handler,
				exchanges: [logTo(fn)],
			});
			client.fetch(query);
			client.fetch(query);
			client.fetch(query);

			expect(fn).toBeCalledWith($fetch(query));
			expect(fn).toBeCalledTimes(1);
		});

		it('should call subscriber with state updates', async () => {
			const fetch = () => handler();

			const client = createClient({
				handler: fetch,
				exchanges: [],
			});

			let sub = jest.fn();
			client.fetch(query, sub);
			await delay(1);

			expect(sub).toBeCalledWith('pending', undefined);
			expect(sub).toBeCalledWith('completed', data);
			expect(sub).toBeCalledTimes(2);

			sub = jest.fn();
			client.fetch({ ...query, id: 'avoid-cache' }, sub).cancel();
			await delay(1);

			expect(sub).toBeCalledWith('pending', undefined);
			expect(sub).toBeCalledWith('cancelled', undefined);

			sub = jest.fn();
			client.fetch(stream, sub);
			await delay(1);

			expect(sub).toBeCalledWith('pending', undefined);
			expect(sub).toBeCalledWith('streaming', data);
			expect(sub).toBeCalledWith('completed', data);

			sub = jest.fn();
			handler = () => Promise.reject({ failed: true });
			client.fetch({ ...query, id: 'avoid-cache2' }, sub);
			await delay(1);

			expect(sub).toBeCalledWith('pending', undefined);
			expect(sub).toBeCalledWith('failed', undefined, { failed: true });
		});

		it('should emit "cancel" on .cancel()', () => {
			const fn = jest.fn();
			const client = createClient({
				handler,
				exchanges: [logTo(fn)],
			});
			const { cancel } = client.fetch(query);
			cancel();

			expect(fn).toBeCalledWith($fetch(query));
			expect(fn).toBeCalledWith($cancel(query));
		});

		it('should remove listener on .unsubscribe()', async () => {
			const client = createClient({
				handler,
				exchanges: [],
			});

			const sub = jest.fn();
			const { unsubscribe } = client.fetch(query, sub);
			unsubscribe();

			expect(sub).toBeCalledWith('pending', undefined);
			expect(sub).toBeCalledTimes(1);
		});

		it('should cancel inactive requests on .unsubscribe()', async () => {
			const fn = jest.fn();
			let resolver = handler;
			const client = createClient({
				handler: (...args: []) => resolver(...args),
				exchanges: [logTo(fn)],
			});

			// 1. Inactive queries
			client.fetch(query, jest.fn()).unsubscribe();
			expect(fn).toBeCalledWith($cancel(query));

			// 2. Active queries
			client.fetch(mutation, jest.fn()); // prevents cancelation
			client.fetch(mutation, jest.fn()).unsubscribe();
			expect(fn).not.toBeCalledWith($cancel(mutation));

			// 3. Inactive queries in streaming state
			resolver = () =>
				new Observable(o => {
					o.next(1);
					setTimeout(() => o.next(2), 200);
				});

			const { unsubscribe } = client.fetch(stream, jest.fn());
			await delay(50);

			unsubscribe();
			expect(fn).toBeCalledWith($buffer(stream, 1));
			expect(fn).not.toBeCalledWith($complete(stream));

			expect(fn).toBeCalledWith($cancel(stream));
		});
	});

	describe('.prefetch', () => {
		it('should emit fetch operation', () => {
			const fn = jest.fn();
			const client = createClient({
				handler: jest.fn(),
				exchanges: [logTo(fn)],
			});

			client.prefetch(query);
			expect(fn).toBeCalledWith($fetch(query));
		});

		it('should immediately mark the query as inactive', async () => {
			const fn = jest.fn();
			const client = createClient({
				handler: jest.fn(),
				gc: { maxAge: 10 },
				exchanges: [logTo(fn)],
			});

			client.prefetch(query);
			await delay(15);

			expect(fn).toBeCalledWith(
				$dispose({ id: query.id, type: undefined })
			);
		});

		it('should be void', () => {
			const client = createClient({
				handler: jest.fn(),
			});

			expect(client.prefetch(query)).toBeUndefined();
		});
	});
});
