// Packages
import React from 'react';
import delay from 'delay';
import { act, renderHook } from '@testing-library/react-hooks';

// Ours
import { createClient, Client } from './client';
import { useClient, useFetch, ClientProvider } from './react';

const DATA = [
	{ id: 1, name: 'Alice' },
	{ id: 2, name: 'Bob' },
];

// A Spy on client.fetch()'s result
const spy = {
	cancel: jest.fn() as any,
	hasMore: jest.fn() as any,
	fetchMore: jest.fn() as any,
	unsubscribe: jest.fn() as any,
};

let client: Client;

beforeEach(() => {
	client = createClient({
		fetch: async () => {
			await delay(10);
			return DATA;
		},
	});

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

const render = <R>(cb: (props: unknown) => R) =>
	renderHook<any, R>(cb, {
		wrapper: ({ children }) =>
			React.createElement(ClientProvider, { value: client }, children),
	});

describe('useClient', () => {
	test('should return client context value', () => {
		client = createClient({ fetch: jest.fn() });
		const { result } = render(() => useClient());

		expect(result.current).toEqual(client);
	});

	test('should throw if value is not set', () => {
		client = undefined;
		const { result } = render(() => useClient());

		expect(result.error.message).toMatch(/client/i);
	});
});

describe('useFetch', () => {
	test('should expose Query interface', async () => {
		const { result } = render(() => useFetch({}));

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
		const { result, waitForNextUpdate } = render(() => useFetch({}));

		expect(result.current.state).toEqual('pending');
		await waitForNextUpdate();
		expect(result.current.state).toEqual('completed');
	});

	test('should populate data on response', async () => {
		const { result, waitForNextUpdate } = render(() => useFetch({}));

		expect(result.current.data).toEqual(undefined);
		await waitForNextUpdate();

		expect(result.current.data).toEqual(DATA);
	});

	test('should report errors', async () => {
		const error = new Error('FAILED');
		client = createClient({
			fetch: () => Promise.reject(error),
		});

		const { result, waitForNextUpdate } = render(() => useFetch({}));

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
		const { rerender } = render(() => useFetch({}));

		rerender();
		rerender();
		rerender();

		expect(fetch).toBeCalledTimes(1);
	});

	test('should unsubscribe on unmount', async () => {
		render(() => useFetch({})).unmount();

		expect(spy.unsubscribe).toBeCalledTimes(1);
	});

	test('should not fetch if request is not ready', async () => {
		const fetch = jest.spyOn(client, 'fetch');

		// not ready
		render(() => useFetch((): any => 0));
		render(() => useFetch((): any => ''));
		render(() => useFetch((): any => false));
		render(() => useFetch((): any => null));
		render(() => useFetch((): any => NaN));
		render(() => useFetch((): any => {}));

		expect(fetch).not.toBeCalled();

		// ready
		render(() => useFetch(() => ({})));
		expect(fetch).toBeCalledTimes(1);
	});

	describe('cancel()', () => {
		test('should wrap result.cancel', async () => {
			const { result } = render(() => useFetch({}));

			act(() => {
				result.current.cancel();
			});

			expect(spy.cancel).toBeCalledTimes(1);
		});
	});

	describe('hasMore()', () => {
		test('should wrap result.hasMore', async () => {
			const { result } = render(() => useFetch({}));

			act(() => {
				result.current.hasMore();
			});

			expect(spy.hasMore).toBeCalledTimes(1);
		});

		test('should throw if called too early', async () => {
			const { result } = render(() => useFetch((): any => null));

			expect(() => {
				act(() => {
					result.current.hasMore();
				});
			}).toThrow(/not allowed/);
		});
	});

	describe('fetchMore()', () => {
		test('should wrap result.fetchMore', async () => {
			const { result } = render(() => useFetch({}));

			act(() => {
				result.current.fetchMore();
			});

			expect(spy.fetchMore).toBeCalledTimes(1);
		});

		test('should throw if called too early', async () => {
			const { result } = render(() => useFetch((): any => null));

			expect(() => {
				act(() => {
					result.current.fetchMore();
				});
			}).toThrow(/not allowed/);
		});
	});
});
