// Packages
import delay from 'delay';
import * as rx from 'rxjs';

// Ours
import { Cache } from './utils/cache';
import { createClient } from './client';
import { buildRequest } from './request';
import { Exchange } from './utils/exchanges';
import {
	$fetch,
	$cancel,
	$dispose,
	$complete,
	$put,
} from './utils/operations';

// @ts-ignore
global.__DEV__ = false;

const request = buildRequest({
	url: '/api',
	body: {},
});

const DATA = [
	{ id: 1, name: 'React' },
	{ id: 2, name: 'Svelte' },
];

const ERROR = new Error('unknown');

describe('client', () => {
	const toChange = (e: any) => ({
		data: undefined,
		error: undefined,
		...e,
	});

	const logOptions = (fn: any): Exchange => ({
		name: 'log-options',
		init: (api) => {
			fn(api);
			return (next) => (op) => next(op);
		},
	});

	const logOperations = (fn: any): Exchange => ({
		name: 'log-operations',
		init: () => (next) => (op) => {
			fn(op);
			return next(op);
		},
	});

	it('should expose public interface', () => {
		const client = createClient({ fetch: jest.fn() });

		expect(client).toEqual({
			fetch: expect.any(Function),
			prefetch: expect.any(Function),
		});
	});

	it('should not throw when no exchanges were passed', () => {
		const fetch = jest.fn();

		expect(() => {
			createClient({ fetch });
		}).not.toThrow();

		expect(() => {
			createClient({ fetch, exchanges: [] });
		}).not.toThrow();

		expect(fetch).not.toBeCalled();
	});

	it('should pass necessary options to exchanges', () => {
		const api = {
			emit: expect.any(Function),
			cache: expect.objectContaining({
				get: expect.any(Function),
				has: expect.any(Function),
			}),
		};

		const log = jest.fn();
		createClient({
			fetch: jest.fn(),
			exchanges: [logOptions(log)],
		});

		expect(log).toBeCalledWith(api);
	});

	it('should dispose unused requests', async () => {
		const log = jest.fn();
		const client = createClient({
			fetch: jest.fn(),
			cache: { maxAge: 5 },
			exchanges: [logOperations(log)],
		});

		// No subscriber? immediatly unused
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
			cache: { maxAge: 5 },
			fetch: async () => DATA,
			exchanges: [logOptions(log)],
		});

		// Immediatly unused (no subscriber)
		client.fetch(request);
		await delay(10);

		expect(cache.get(request.id)).toBeUndefined();
	});

	describe('.fetch()', () => {
		it('should emit fetch operation', () => {
			const log = jest.fn();
			const client = createClient({
				fetch: jest.fn(),
				exchanges: [logOperations(log)],
			});

			client.fetch(request);

			expect(log).toBeCalledWith($fetch(request));
		});

		it('should not duplicate requests', () => {
			const log = jest.fn();
			const client = createClient({
				fetch: () => delay(10),
				exchanges: [logOperations(log)],
			});

			client.fetch(request);
			client.fetch(request);
			client.fetch(request);

			expect(log).toBeCalledWith($fetch(request));
			expect(log).toBeCalledTimes(1);
		});

		it('should notify subscriber with changes', async () => {
			const subscriber = jest.fn();
			let handler: any = () => delay(5).then(() => DATA);

			const client = createClient({
				fetch: () => handler(),
			});

			// success
			client.fetch(request, subscriber);
			await delay(10);

			expect(subscriber).toBeCalledWith(
				toChange({ status: 'pending' })
			);
			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'completed',
					data: DATA,
				})
			);
			expect(subscriber).toBeCalledTimes(2);

			// cancellation
			subscriber.mockClear();
			client.fetch(request).cancel();
			await delay(10);

			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'pending',
					data: DATA,
				})
			);
			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'cancelled',
					data: DATA,
				})
			);
			expect(subscriber).toBeCalledTimes(2);

			// buffering
			subscriber.mockClear();
			handler = () => rx.from(delay(5).then(() => DATA));
			client.fetch(request);
			await delay(10);

			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'pending',
					data: DATA,
				})
			);
			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'buffering',
					data: DATA,
				})
			);
			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'completed',
					data: DATA,
				})
			);

			// failure
			subscriber.mockClear();
			handler = () => Promise.reject(ERROR);
			client.fetch(request);
			await delay(10);

			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'pending',
					data: DATA,
				})
			);
			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'failed',
					data: DATA,
					error: ERROR,
				})
			);
		});

		describe('.cancel()', () => {
			it('should emit "cancel"', () => {
				const log = jest.fn();

				const client = createClient({
					fetch: () => delay(10),
					exchanges: [logOperations(log)],
				});

				client.fetch(request).cancel();

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($cancel(request));
			});
		});

		describe('.refetch()', () => {
			it('should emit "fetch" if necessary', async () => {
				const log = jest.fn();

				let handler: any = async () => {
					await delay(10);
					throw new Error();
				};

				const client = createClient({
					fetch: () => handler(),
					exchanges: [logOperations(log)],
				});

				const actions = client.fetch(request);

				// pending
				log.mockClear();
				actions.refetch();
				expect(log).not.toHaveBeenCalled();

				await delay(15);

				handler = async () => {
					await delay(10);
					return 'OK';
				};

				// failed
				log.mockClear();
				actions.refetch();

				expect(log).toBeCalledWith($fetch(request));

				// cancelled
				log.mockClear();
				actions.cancel();
				actions.refetch();

				expect(log).toBeCalledWith($fetch(request));

				await delay(15);

				// completed
				log.mockClear();
				actions.refetch();

				expect(log).toBeCalledWith($fetch(request));
			});
		});

		describe('.unsubscribe()', () => {
			it('should remove listener', async () => {
				const client = createClient({
					fetch: jest.fn(),
				});

				const subscriber = jest.fn();
				client.fetch(request, subscriber).unsubscribe();

				await delay(10);

				expect(subscriber).toBeCalledWith(
					toChange({ status: 'pending' })
				);
				expect(subscriber).toBeCalledTimes(1);
			});

			it('should cancel unused requests', async () => {
				const log = jest.fn();
				let handler = async () => delay(5).then(() => DATA);

				const client = createClient({
					fetch: () => handler(),
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
			it('should success if a pull source is ready', async () => {
				let gen = (async function*() {
					await delay(5);
					yield DATA;
				})();

				let handler: any = () => async () => {
					return (await gen.next()).value;
				};

				const client = createClient({
					fetch: () => handler(),
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
				handler = async () => {
					await delay(5);
					throw ERROR;
				};

				client.fetch(request);
				await delay(10);
				expect(stream.hasMore()).toEqual(false);

				// buffering
				handler = () =>
					new rx.Observable((o) => {
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
				const meta = { pull: true };
				const log = jest.fn();
				const gen = (function*() {
					yield 1;
					yield 2;
					yield 3;
				})();

				const client = createClient({
					fetch: () => () => gen.next(),
					exchanges: [logOperations(log)],
				});

				const stream = client.fetch(request);
				await delay(10);

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($put(request, 1, meta));
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				stream.fetchMore();
				await delay(10);

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($put(request, 2, meta));
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				stream.fetchMore();
				await delay(10);

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($put(request, 3, meta));
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
				const meta = { pull: true };
				const log = jest.fn();
				const gen = (function*() {
					yield DATA[0];
					yield DATA[1];
				})();

				const client = createClient({
					fetch: () => () => gen.next(),
					exchanges: [logOperations(log)],
				});

				const stream = client.fetch(request);
				await delay(10);

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($put(request, DATA[0], meta));
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				stream.fetchMore();
				stream.fetchMore();
				stream.fetchMore();
				stream.fetchMore();
				stream.fetchMore();
				await delay(10);

				expect(log).toBeCalledWith($fetch(request));
				expect(log).toBeCalledWith($put(request, DATA[1], meta));
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
		it('should fetch and save response for later', async () => {
			const log = jest.fn();
			const meta = { pull: true };

			const gen = (function*() {
				yield 1;
				yield 2;
				yield 3;
			})();

			const handler = jest.fn().mockImplementation(() => {
				return () => delay(5).then(() => gen.next());
			});

			const client = createClient({
				fetch: () => handler(),
				exchanges: [logOperations(log)],
			});

			// fetch
			client.prefetch(request);
			expect(log).toBeCalledWith($fetch(request));
			expect(log).toBeCalledTimes(1);

			await delay(10);

			// reuse the response once
			log.mockClear();
			const subscriber = jest.fn();
			client.prefetch(request);
			client.fetch(request, subscriber);

			expect(log).not.toBeCalledWith($fetch(request));
			expect(subscriber).toBeCalledWith(
				toChange({ status: 'ready', data: 1 })
			);

			// fetch more
			log.mockClear();
			client.fetch(request);

			await delay(10);

			expect(log).toBeCalledWith($fetch(request));
			expect(log).toBeCalledWith($put(request, 2, meta));
			expect(subscriber).toBeCalledWith(
				toChange({ status: 'ready', data: 2 })
			);
		});

		it('should respect prefetch errors', async () => {
			const log = jest.fn();

			const client = createClient({
				fetch: () =>
					delay(5).then(() => {
						throw ERROR;
					}),

				exchanges: [logOperations(log)],
			});

			// fetch
			client.prefetch(request);
			expect(log).toBeCalledWith($fetch(request));
			expect(log).toBeCalledTimes(1);

			await delay(10);

			// reuse the response once
			log.mockClear();
			const subscriber = jest.fn();
			client.prefetch(request);
			client.fetch(request, subscriber);

			expect(log).not.toBeCalledWith($fetch(request));
			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'failed',
					error: ERROR,
				})
			);

			// can retry
			log.mockClear();
			subscriber.mockClear();
			client.fetch(request);

			await delay(10);

			expect(log).toBeCalledWith($fetch(request));
		});

		it('should immediately mark the request as inactive', async () => {
			const log = jest.fn();

			const client = createClient({
				fetch: jest.fn(),
				cache: { maxAge: 5 },
				exchanges: [logOperations(log)],
			});

			client.prefetch(request);
			await delay(10);

			expect(log).toBeCalledWith($dispose({ id: request.id }));
		});

		it('should be void', () => {
			const client = createClient({
				fetch: jest.fn(),
			});

			expect(client.prefetch(request)).toBeUndefined();
		});
	});
});
