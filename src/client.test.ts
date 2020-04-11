// Packages
import delay from 'delay';
import * as rx from 'rxjs';

// Ours
import { createClient } from './client';
import { createRequest } from './request';
import { Exchange, Cache } from './utils/types';
import {
	$fetch,
	$cancel,
	$dispose,
	$complete,
	$buffer,
} from './utils/operations';

const request = createRequest({
	url: '/api',
	body: {},
});

const DATA = [
	{ id: 1, name: 'React' },
	{ id: 2, name: 'Svelte' },
];

const ERROR = new Error('unknown');

describe('client', () => {
	const logOptions = (fn: any): Exchange => ({
		name: 'log-options',
		init: api => {
			fn(api);
			return next => op => next(op);
		},
	});

	const logOperations = (fn: any): Exchange => ({
		name: 'log-operations',
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
		const handler = jest.fn();

		expect(() => {
			createClient({ handler });
		}).not.toThrow();

		expect(() => {
			createClient({ handler, exchanges: [] });
		}).not.toThrow();

		expect(handler).not.toBeCalled();
	});

	it('should pass necessary options to exchanges', () => {
		const api = {
			emit: expect.any(Function),
			cache: {
				get: expect.any(Function),
				has: expect.any(Function),
				entries: expect.any(Function),
				keys: expect.any(Function),
				values: expect.any(Function),
			},
		};

		const log = jest.fn();
		createClient({
			handler: jest.fn(),
			exchanges: [logOptions(log)],
		});

		expect(log).toBeCalledWith(api);
	});

	it('should dispose inactive requests', async () => {
		const log = jest.fn();
		const client = createClient({
			handler: jest.fn(),
			gc: { maxAge: 5 },
			exchanges: [logOperations(log)],
		});

		// No subscriber? immediatly inactive
		client.prefetch(request);
		await delay(10);

		expect(log).toBeCalledWith($dispose({ id: request.id }));

		// Has subscriber? wait for .unsubscribe()
		log.mockClear();
		const sub = client.fetch(request, jest.fn());
		await delay(10);

		expect(log).not.toBeCalledWith($dispose({ id: request.id }));

		sub.unsubscribe();
		await delay(10);

		expect(log).toBeCalledWith($dispose({ id: request.id }));

		// At least one subscriber? don't dispose
		log.mockClear();
		client.fetch(request);
		client.fetch(request, jest.fn());
		await delay(10);

		expect(log).not.toBeCalledWith($dispose({ id: request.id }));
	});

	it('should clear cache on "dispose"', async () => {
		let cache: Cache;

		const log = (op: any) => {
			cache = op.cache;
		};

		const client = createClient({
			gc: { maxAge: 5 },
			handler: async () => DATA,
			exchanges: [logOptions(log)],
		});

		// Immediatly inactive (no subscriber)
		client.fetch(request);
		await delay(10);

		expect(cache.get(request.id)).toBeUndefined();
	});

	describe('.fetch()', () => {
		it('should emit fetch operation', () => {
			const log = jest.fn();
			const client = createClient({
				handler: jest.fn(),
				exchanges: [logOperations(log)],
			});

			client.fetch(request);

			expect(log).toBeCalledWith($fetch(request));
		});

		it('should not duplicate requests', () => {
			const log = jest.fn();
			const client = createClient({
				handler: () => delay(10),
				exchanges: [logOperations(log)],
			});

			client.fetch(request);
			client.fetch(request);
			client.fetch(request);

			expect(log).toBeCalledWith($fetch(request));
			expect(log).toBeCalledTimes(1);
		});

		it('should provide updates to the subscriber', async () => {
			let handler: any = () => delay(5).then(() => DATA);

			const client = createClient({
				handler: () => handler(),
			});

			// success
			const subscriber = jest.fn();
			client.fetch(request, subscriber);
			await delay(10);

			expect(subscriber).toBeCalledWith('pending', undefined);
			expect(subscriber).toBeCalledWith('completed', DATA);
			expect(subscriber).toBeCalledTimes(2);

			// cancellation
			subscriber.mockClear();
			client.fetch(request).cancel();
			await delay(10);

			expect(subscriber).toBeCalledWith('pending', DATA);
			expect(subscriber).toBeCalledWith('cancelled', DATA);
			expect(subscriber).toBeCalledTimes(2);

			// buffering
			subscriber.mockClear();
			handler = () => rx.from(delay(5).then(() => DATA));
			client.fetch(request);
			await delay(10);

			expect(subscriber).toBeCalledWith('pending', DATA);
			expect(subscriber).toBeCalledWith('streaming', DATA);
			expect(subscriber).toBeCalledWith('completed', DATA);

			// failure
			subscriber.mockClear();
			handler = () => Promise.reject(ERROR);
			client.fetch(request);
			await delay(10);

			expect(subscriber).toBeCalledWith('pending', DATA);
			expect(subscriber).toBeCalledWith('failed', DATA, ERROR);
		});

		describe('.cancel()', () => {
			it('should emit "cancel"', () => {
				const log = jest.fn();

				const client = createClient({
					handler: () => delay(10),
					exchanges: [logOperations(log)],
				});

				client.fetch(request).cancel();

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($cancel(request));
			});
		});

		describe('.unsubscribe()', () => {
			it('should remove listener', async () => {
				const client = createClient({
					handler: jest.fn(),
				});

				const subscriber = jest.fn();
				client.fetch(request, subscriber).unsubscribe();

				await delay(10);

				expect(subscriber).toBeCalledWith('pending', undefined);
				expect(subscriber).toBeCalledTimes(1);
			});

			it('should cancel inactive requests', async () => {
				const log = jest.fn();
				let handler = async () => delay(5).then(() => DATA);

				const client = createClient({
					handler: () => handler(),
					exchanges: [logOperations(log)],
				});

				// Has no subscriber? cancel
				client.fetch(request, jest.fn()).unsubscribe();

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($cancel(request));
				expect(log).toBeCalledTimes(2);

				// Has some subscriber? don't cancel
				log.mockClear();
				const { cancel } = client.fetch(request, jest.fn()); // <--- (R)
				client.fetch(request, jest.fn()).unsubscribe();

				expect(log).toBeCalledWith($fetch(request));
				expect(log).not.toBeCalledWith($cancel(request));
				expect(log).toBeCalledTimes(1);

				// Request completed? too late cancel
				log.mockClear();
				await delay(10); // wait for (R)
				cancel();

				expect(log).toBeCalledWith($complete(request, DATA));
				expect(log).not.toBeCalledWith($cancel(request));
			});
		});

		describe('.hasMore()', () => {
			it('should success if a lazy source is ready', async () => {
				let gen = (async function*() {
					await delay(5);
					yield DATA;
				})();

				let handler: any = () => async () => {
					return (await gen.next()).value;
				};

				const client = createClient({
					handler: () => handler(),
				});

				const stream = client.fetch(request);

				// pending
				expect(stream.hasMore()).toEqual(false);

				// ready
				await delay(10);
				expect(stream.hasMore()).toEqual(true);

				// cancelled
				client.fetch(request).cancel();
				expect(stream.hasMore()).toEqual(false);

				// failure
				gen = (async function*() {
					await delay(5);
					throw ERROR;
				})();

				client.fetch(request);
				await delay(10);
				expect(stream.hasMore()).toEqual(false);

				// streaming
				handler = () =>
					new rx.Observable(o => {
						Promise.resolve()
							.then(() => o.next(DATA))
							.then(() => delay(10))
							.then(() => o.next(DATA))
							.finally(() => o.complete());
					});

				client.fetch(request);
				await delay(5);

				expect(stream.hasMore()).toEqual(false);
			});
		});

		describe('.fetchMore()', () => {
			it('should emit fetch operation(s)', async () => {
				const meta = { lazy: true };
				const log = jest.fn();
				const gen = (function*() {
					yield 1;
					yield 2;
					yield 3;
				})();

				const client = createClient({
					handler: () => () => gen.next().value,
					exchanges: [logOperations(log)],
				});

				const stream = client.fetch(request);
				await delay(10);

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($buffer(request, 1, meta));
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				stream.fetchMore();
				await delay(10);

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($buffer(request, 2, meta));
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				stream.fetchMore();
				await delay(10);

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($buffer(request, 3, meta));
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				stream.fetchMore();
				await delay(10);

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($complete(request));
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				stream.fetchMore();
				await delay(10);

				expect(log).not.toBeCalledWith($fetch(request));
				expect(log).toBeCalledTimes(0);
			});

			it('should dedeuplicate calls', async () => {
				const meta = { lazy: true };
				const log = jest.fn();
				const gen = (function*() {
					yield DATA[0];
					yield DATA[1];
				})();

				const client = createClient({
					handler: () => () => gen.next().value,
					exchanges: [logOperations(log)],
				});

				const stream = client.fetch(request);
				await delay(10);

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($buffer(request, DATA[0], meta));
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				stream.fetchMore();
				stream.fetchMore();
				stream.fetchMore();
				stream.fetchMore();
				stream.fetchMore();
				await delay(10);

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($buffer(request, DATA[1], meta));
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				stream.fetchMore();
				stream.fetchMore();
				stream.fetchMore();
				stream.fetchMore();
				stream.fetchMore();
				await delay(10);

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($complete(request));
				expect(log).toBeCalledTimes(2);
			});
		});
	});

	describe('.prefetch()', () => {
		it('should emit fetch operation', () => {
			const log = jest.fn();

			const client = createClient({
				handler: jest.fn(),
				exchanges: [logOperations(log)],
			});

			client.prefetch(request);

			expect(log).toBeCalledWith($fetch(request));
		});

		it('should immediately mark the request as inactive', async () => {
			const log = jest.fn();

			const client = createClient({
				handler: jest.fn(),
				gc: { maxAge: 5 },
				exchanges: [logOperations(log)],
			});

			client.prefetch(request);
			await delay(10);

			expect(log).toBeCalledWith($dispose({ id: request.id }));
		});

		it('should be void', () => {
			const client = createClient({
				handler: jest.fn(),
			});

			expect(client.prefetch(request)).toBeUndefined();
		});
	});
});
