// Packages
import delay from 'delay';

// Ours
import { Cache } from './utils/cache';
import { $ } from './utils/operations';
import { createClient } from './client';
import { Plugin } from './plugins/api';
import { createRequest } from './request';

// @ts-ignore
global.__DEV__ = false;

const request = createRequest({
	url: '/api',
	variables: {},
});

const data = [
	{ id: 1, name: 'React' },
	{ id: 2, name: 'Svelte' },
];

const error = new Error('unknown');

describe('client', () => {
	const toChange = (e: any) => ({
		data: undefined,
		error: undefined,
		...e,
	});

	const logOptions = (fn: any): Plugin => ({
		name: 'log-options',
		init: (api) => {
			fn(api);
			return (next) => (op) => next(op);
		},
	});

	const logOperations = (fn: any): Plugin => ({
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

	it('should not throw when no plugins were passed', () => {
		const fetch = jest.fn();

		expect(() => {
			createClient({ fetch });
		}).not.toThrow();

		expect(() => {
			createClient({ fetch, plugins: [] });
		}).not.toThrow();

		expect(fetch).not.toBeCalled();
	});

	it('should pass necessary options to plugins', () => {
		const api = {
			apply: expect.any(Function),
			cache: expect.objectContaining({
				get: expect.any(Function),
				has: expect.any(Function),
			}),
		};

		const log = jest.fn();
		createClient({
			fetch: jest.fn(),
			plugins: [logOptions(log)],
		});

		expect(log).toBeCalledWith(api);
	});

	it('should dispose unused requests', async () => {
		const log = jest.fn();
		const client = createClient({
			fetch: jest.fn(),
			cache: { disposeTime: 5 },
			plugins: [logOperations(log)],
		});

		// No subscriber? immediatly unused
		client.prefetch(request);
		await delay(10);

		expect(log).toBeCalledWith($('dispose', { request }));

		// Has subscriber? wait for .unsubscribe()
		log.mockClear();
		const sub = client.fetch(request, jest.fn());
		await delay(10);

		expect(log).not.toBeCalledWith($('dispose', { request }));

		sub.unsubscribe();
		await delay(10);

		expect(log).toBeCalledWith($('dispose', { request }));

		// At least one subscriber? don't dispose
		log.mockClear();
		client.fetch(request);
		client.fetch(request, jest.fn());
		await delay(10);

		expect(log).not.toBeCalledWith($('dispose', { request }));
	});

	it('should clear cache on "dispose"', async () => {
		let cache: Cache;

		const log = (op: any) => {
			cache = op.cache;
		};

		const client = createClient({
			cache: { disposeTime: 5 },
			fetch: async () => data,
			plugins: [logOptions(log)],
		});

		// Immediatly unused (no subscriber)
		client.fetch(request);
		await delay(10);

		expect(cache.get(request.id)).toBeUndefined();
	});

	describe('.fetch()', () => {
		it('should convert query to request if necessary', async () => {
			const log = jest.fn();
			const client = createClient({
				fetch: jest.fn(),
				plugins: [logOperations(log)],
			});

			client.fetch(request);
			await delay(1);
			client.fetch(request.query);

			expect(log).toBeCalledWith($('fetch', { request }));
			expect(log).toBeCalledWith($('fetch', { request }));
			expect(log).toBeCalledTimes(3);
		});

		it('should not duplicate requests', () => {
			const log = jest.fn();
			const client = createClient({
				fetch: () => delay(10),
				plugins: [logOperations(log)],
			});

			client.fetch(request);
			client.fetch(request);
			client.fetch(request);

			expect(log).toBeCalledWith($('fetch', { request }));
			expect(log).toBeCalledTimes(1);
		});

		it('should notify subscriber with changes', async () => {
			const subscriber = jest.fn();
			let handler: any = () => delay(5).then(() => data);

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
					data,
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
					data,
				})
			);
			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'cancelled',
					data,
				})
			);
			expect(subscriber).toBeCalledTimes(2);

			// buffering
			subscriber.mockClear();
			handler = () => (o: any) => {
				delay(5).then(() => {
					o.next(data);
					o.complete();
				});
			};
			client.fetch(request);
			await delay(10);

			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'pending',
					data,
				})
			);
			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'buffering',
					data,
				})
			);
			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'completed',
					data,
				})
			);

			// failure
			subscriber.mockClear();
			handler = () => Promise.reject(error);
			client.fetch(request);
			await delay(10);

			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'pending',
					data,
				})
			);
			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'failed',
					data,
					error,
				})
			);
		});

		describe('.cancel()', () => {
			it('should emit "cancel"', () => {
				const log = jest.fn();

				const client = createClient({
					fetch: () => delay(10),
					plugins: [logOperations(log)],
				});

				client.fetch(request).cancel();

				expect(log).toBeCalledWith($('fetch', { request }));
				expect(log).toBeCalledWith($('cancel', { request }));
			});
		});

		describe('.refetch()', () => {
			it('should cancel then fetch', async () => {
				const log = jest.fn();

				let handler: any = async () => {
					await delay(10);
					throw new Error();
				};

				const client = createClient({
					fetch: () => handler(),
					plugins: [logOperations(log)],
				});

				const operations = client.fetch(request);

				// pending
				log.mockClear();
				operations.refetch();

				expect(log).toHaveBeenCalledWith($('cancel', { request }));
				expect(log).toHaveBeenCalledWith($('fetch', { request }));
				expect(log).toHaveBeenCalledTimes(2);
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
				let handler = async () => delay(5).then(() => data);

				const client = createClient({
					fetch: () => handler(),
					plugins: [logOperations(log)],
				});

				// Has no subscriber? cancel
				client.fetch(request, jest.fn()).unsubscribe();

				expect(log).toBeCalledWith($('fetch', { request }));
				expect(log).toBeCalledWith($('cancel', { request }));
				expect(log).toBeCalledTimes(2);

				// Has some subscriber? don't cancel
				log.mockClear();
				const { cancel } = client.fetch(request, jest.fn()); // <--- (R)
				client.fetch(request, jest.fn()).unsubscribe();

				expect(log).toBeCalledWith($('fetch', { request }));
				expect(log).not.toBeCalledWith($('cancel', { request }));
				expect(log).toBeCalledTimes(1);

				// Request completed? too late cancel
				log.mockClear();
				await delay(10); // wait for (R)
				cancel();

				expect(log).toBeCalledWith($('complete', { request, data }));
				expect(log).not.toBeCalledWith($('cancel', { request }));
			});
		});

		describe('.hasMore()', () => {
			it('should success if the source is lazy and ready', async () => {
				let gen = (async function*() {
					await delay(5);
					yield data;
				})();

				let handler: any = () => gen;

				const client = createClient({
					fetch: () => handler(),
				});

				const query = client.fetch(request);

				// pending
				expect(query.hasMore()).toEqual(false);

				// ready
				await delay(10);
				expect(query.hasMore()).toEqual(true);

				// cancelled
				client.fetch(request).cancel();
				expect(query.hasMore()).toEqual(false);

				// failure
				handler = async () => {
					await delay(5);
					throw error;
				};

				client.fetch(request);
				await delay(10);
				expect(query.hasMore()).toEqual(false);

				// buffering
				handler = () => (o: any) => {
					Promise.resolve()
						.then(() => o.next(data))
						.then(() => delay(10))
						.finally(() => o.complete());
				};

				client.fetch(request);
				await delay(5);

				expect(query.hasMore()).toEqual(false);
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
					fetch: () => gen,
					plugins: [logOperations(log)],
				});

				const query = client.fetch(request);
				await delay(10);

				expect(log).toBeCalledWith($('fetch', { request }));
				expect(log).toBeCalledWith(
					$('put', { request, data: 1 }, meta)
				);
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				query.fetchMore();
				await delay(10);

				expect(log).toBeCalledWith($('fetch', { request }));
				expect(log).toBeCalledWith(
					$('put', { request, data: 2 }, meta)
				);
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				query.fetchMore();
				await delay(10);

				expect(log).toBeCalledWith($('fetch', { request }));
				expect(log).toBeCalledWith(
					$('put', { request, data: 3 }, meta)
				);
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				query.fetchMore();
				await delay(10);

				expect(log).toBeCalledWith($('fetch', { request }));
				expect(log).toBeCalledWith($('complete', { request }));
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				query.fetchMore();
				await delay(10);

				expect(log).not.toBeCalledWith($('fetch', { request }));
				expect(log).toBeCalledTimes(0);
			});

			it('should dedeuplicate calls', async () => {
				const meta = { lazy: true };
				const log = jest.fn();
				const gen = (function*() {
					yield data[0];
					yield data[1];
				})();

				const client = createClient({
					fetch: () => gen,
					plugins: [logOperations(log)],
				});

				const query = client.fetch(request);
				await delay(10);

				expect(log).toBeCalledWith($('fetch', { request }));
				expect(log).toBeCalledWith(
					$('put', { request, data: data[0] }, meta)
				);
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				query.fetchMore();
				query.fetchMore();
				query.fetchMore();
				query.fetchMore();
				query.fetchMore();
				await delay(10);

				expect(log).toBeCalledWith($('fetch', { request }));
				expect(log).toBeCalledWith(
					$('put', { request, data: data[1] }, meta)
				);
				expect(log).toBeCalledTimes(2);

				log.mockClear();
				query.fetchMore();
				query.fetchMore();
				query.fetchMore();
				query.fetchMore();
				query.fetchMore();
				await delay(10);

				expect(log).toBeCalledWith($('fetch', { request }));
				expect(log).toBeCalledWith($('complete', { request }));
				expect(log).toBeCalledTimes(2);
			});
		});
	});

	describe('.prefetch()', () => {
		it('should fetch and save response for later', async () => {
			const log = jest.fn();
			const meta = { lazy: true };

			const gen = (async function*() {
				await delay(5);
				yield 1;

				await delay(5);
				yield 2;

				await delay(5);
				yield 3;
			})();

			const handler = () => gen;

			const client = createClient({
				fetch: () => handler(),
				plugins: [logOperations(log)],
			});

			// fetch
			client.prefetch(request);
			expect(log).toBeCalledWith($('fetch', { request }));
			expect(log).toBeCalledTimes(1);

			await delay(10);

			// reuse the response once
			log.mockClear();
			const subscriber = jest.fn();
			client.prefetch(request);
			client.fetch(request, subscriber);

			expect(log).not.toBeCalledWith($('fetch', { request }));
			expect(subscriber).toBeCalledWith(
				toChange({ status: 'ready', data: 1 })
			);

			// fetch more
			log.mockClear();
			client.fetch(request);

			await delay(10);

			expect(log).toBeCalledWith($('fetch', { request }));
			expect(log).toBeCalledWith($('put', { request, data: 2 }, meta));
			expect(subscriber).toBeCalledWith(
				toChange({ status: 'ready', data: 2 })
			);
		});

		it('should respect prefetch errors', async () => {
			const log = jest.fn();

			const client = createClient({
				fetch: () =>
					delay(5).then(() => {
						throw error;
					}),

				plugins: [logOperations(log)],
			});

			// fetch
			client.prefetch(request);
			expect(log).toBeCalledWith($('fetch', { request }));
			expect(log).toBeCalledTimes(1);

			await delay(10);

			// reuse the response once
			log.mockClear();
			const subscriber = jest.fn();
			client.prefetch(request);
			client.fetch(request, subscriber);

			expect(log).not.toBeCalledWith($('fetch', { request }));
			expect(subscriber).toBeCalledWith(
				toChange({
					status: 'failed',
					error,
				})
			);

			// can retry
			log.mockClear();
			subscriber.mockClear();
			client.fetch(request);

			await delay(10);

			expect(log).toBeCalledWith($('fetch', { request }));
		});

		it('should immediately mark the request as inactive', async () => {
			const log = jest.fn();

			const client = createClient({
				fetch: jest.fn(),
				cache: { disposeTime: 5 },
				plugins: [logOperations(log)],
			});

			client.prefetch(request);
			await delay(10);

			expect(log).toBeCalledWith($('dispose', { request }));
		});

		it('should convert query to request if necessary', async () => {
			const log = jest.fn();
			const client = createClient({
				fetch: jest.fn(),
				plugins: [logOperations(log)],
			});

			client.prefetch(request);

			expect(log).toBeCalledWith($('fetch', { request }));
		});

		it('should be void', () => {
			const client = createClient({
				fetch: jest.fn(),
			});

			expect(client.prefetch(request)).toBeUndefined();
		});
	});
});
