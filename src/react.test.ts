// Packages
import delay from 'delay';

// Ours
import { createClient, Client } from './client';
import { renderHook, act } from './test-utils/hooks';
import { useClient, useFetch, useRequest } from './react';

const DATA = [
	{ id: 1, name: 'Alice' },
	{ id: 2, name: 'Bob' },
];

const handler = async () => {
	await delay(10);
	return DATA;
};

// A Spy on client.fetch()'s result
const spy = {
	cancel: jest.fn() as any,
	hasMore: jest.fn() as any,
	fetchMore: jest.fn() as any,
	unsubscribe: jest.fn() as any,
};

let client: Client;

beforeEach(() => {
	client = createClient({ handler });

	const originalFetch = client.fetch;

	client.fetch = (...args) => {
		const sub = originalFetch(...args);
		spy.cancel = jest.spyOn(sub, 'cancel');
		spy.hasMore = jest.spyOn(sub, 'hasMore');
		spy.fetchMore = jest.spyOn(sub, 'fetchMore');
		spy.unsubscribe = jest.spyOn(sub, 'unsubscribe');

		return sub;
	};
});

describe('useClient', () => {
	test('should return client context value', () => {
		const client = createClient({ handler: jest.fn() });
		const { result } = renderHook(() => useClient(), client);

		expect(result.current).toEqual(client);
	});

	test('should throw if value is not set', () => {
		const { result } = renderHook(() => useClient());

		expect(result.error.message).toMatch(/client/i);
	});
});

describe('useFetch', () => {
	test('should expose Query interface', async () => {
		const { result } = renderHook(() => useFetch({}), client);

		expect(result.current).toEqual({
			state: 'pending',
			data: undefined,
			error: undefined,
			cancel: expect.any(Function),
			hasMore: expect.any(Function),
			fetchMore: expect.any(Function),
		});
	});

	test('should keep "state" on sync', async () => {
		const { result, waitForNextUpdate } = renderHook(
			() => useFetch({}),
			client
		);

		expect(result.current.state).toEqual('pending');
		await waitForNextUpdate();
		expect(result.current.state).toEqual('completed');
	});

	test('should populate data on response', async () => {
		const { result, waitForNextUpdate } = renderHook(
			() => useFetch({}),
			client
		);

		expect(result.current.data).toEqual(undefined);
		await waitForNextUpdate();

		expect(result.current.data).toEqual(DATA);
	});

	test('should report errors', async () => {
		const error = new Error('FAILED');
		const client = createClient({
			handler: () => Promise.reject(error),
		});

		const { result, waitForNextUpdate } = renderHook(
			() => useFetch({}),
			client
		);

		expect(result.current.data).toEqual(undefined);
		expect(result.current.state).toEqual('pending');
		expect(result.current.error).toEqual(undefined);
		await waitForNextUpdate();

		expect(result.current.data).toEqual(undefined);
		expect(result.current.state).toEqual('failed');
		expect(result.current.error).toEqual(error);
	});

	test('should avoid unnecessary fetching', async () => {
		const fetch = jest.spyOn(client, 'fetch');
		const { rerender } = renderHook(() => useFetch({}), client);

		rerender();
		rerender();
		rerender();

		expect(fetch).toBeCalledTimes(1);
	});

	test('should unsubscribe on unmount', async () => {
		renderHook(() => useFetch({}), client).unmount();

		expect(spy.unsubscribe).toBeCalledTimes(1);
	});

	test('should not fetch if request is not ready', async () => {
		const fetch = jest.spyOn(client, 'fetch');

		// not ready
		renderHook(() => useFetch((): any => 0), client);
		renderHook(() => useFetch((): any => ''), client);
		renderHook(() => useFetch((): any => false), client);
		renderHook(() => useFetch((): any => null), client);
		renderHook(() => useFetch((): any => NaN), client);
		renderHook(() => useFetch((): any => {}), client);

		expect(fetch).not.toBeCalled();

		// ready
		renderHook(() => useFetch(() => ({})), client);
		expect(fetch).toBeCalledTimes(1);
	});

	describe('cancel()', () => {
		test('should wrap result.cancel', async () => {
			const { result } = renderHook(() => useFetch({}), client);

			act(() => {
				result.current.cancel();
			});

			expect(spy.cancel).toBeCalledTimes(1);
		});
	});

	describe('hasMore()', () => {
		test('should wrap result.hasMore', async () => {
			const { result } = renderHook(() => useFetch({}), client);

			act(() => {
				result.current.hasMore();
			});

			expect(spy.hasMore).toBeCalledTimes(1);
		});

		test('should throw if called too early', async () => {
			const { result } = renderHook(
				() => useFetch((): any => null),
				client
			);

			expect(() => {
				act(() => {
					result.current.hasMore();
				});
			}).toThrow(/not allowed/);
		});
	});

	describe('fetchMore()', () => {
		test('should wrap result.fetchMore', async () => {
			const { result } = renderHook(() => useFetch({}), client);

			act(() => {
				result.current.fetchMore();
			});

			expect(spy.fetchMore).toBeCalledTimes(1);
		});

		test('should throw if called too early', async () => {
			const { result } = renderHook(
				() => useFetch((): any => null),
				client
			);

			expect(() => {
				act(() => {
					result.current.fetchMore();
				});
			}).toThrow(/not allowed/);
		});
	});
});

describe('useRequest', () => {
	test('should expose Query interface', async () => {
		const { result } = renderHook(() => useRequest({}), client);

		expect(result.current).toEqual({
			state: undefined,
			data: undefined,
			error: undefined,
			fetch: expect.any(Function),
			cancel: expect.any(Function),
			hasMore: expect.any(Function),
			fetchMore: expect.any(Function),
		});
	});

	test('should only accept plain objects', async () => {
		let hook = renderHook(() => useRequest(() => true), client);
		expect(hook.result.error.message).toMatch(/plain object/);

		hook = renderHook(() => useRequest(null), client);
		expect(hook.result.error.message).toMatch(/plain object/);

		hook = renderHook(() => useRequest(true as any), client);
		expect(hook.result.error.message).toMatch(/plain object/);
	});

	test('should not fetch unless .fetch is called', async () => {
		const { result } = renderHook(() => useRequest({}), client);

		expect(result.current.state).toEqual(undefined);

		expect(() => {
			act(() => {
				result.current.hasMore();
			});
		}).toThrow(/not allowed/);

		expect(() => {
			act(() => {
				result.current.fetchMore();
			});
		}).toThrow(/not allowed/);

		act(() => {
			result.current.fetch();
		});

		expect(result.current.state).toEqual('pending');
	});

	test('should throw if fetch is called more than once', async () => {
		const { result } = renderHook(() => useRequest({}), client);

		act(() => {
			result.current.fetch();
		});

		expect(() => {
			act(() => {
				result.current.fetch();
			});
		}).toThrow(/called more than once/);
	});
});
