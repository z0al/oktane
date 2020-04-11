// Packages
import delay from 'delay';

// Ours
import { renderHook, act } from './test-utils';

import { createClient, Client } from '../client';
import { useFetch, FetchRequest } from './useFetch';

const json = [
	{ id: 1, name: 'Alice' },
	{ id: 2, name: 'Bob' },
];

const handler = async () => {
	await delay(100);
	return json;
};

let client: Client;
beforeEach(() => {
	client = createClient({ handler });
});

test('should expose public interface', async () => {
	const { result } = renderHook<FetchRequest>(
		() => useFetch({}),
		client
	);

	expect(result.current).toEqual({
		state: 'pending',
		data: undefined,
		error: undefined,
		cancel: expect.any(Function),
	});
});

test('should keep "state" on sync', async () => {
	const { result, waitForNextUpdate } = renderHook<FetchRequest>(
		() => useFetch({}),
		client
	);

	expect(result.current.state).toEqual('pending');
	await waitForNextUpdate();
	expect(result.current.state).toEqual('completed');
});

test('should populate data on response', async () => {
	const { result, waitForNextUpdate } = renderHook<FetchRequest>(
		() => useFetch({}),
		client
	);

	expect(result.current.data).toEqual(undefined);
	await waitForNextUpdate();

	expect(result.current.data).toEqual(json);
});

test('should report errors', async () => {
	const error = new Error('FAILED');
	const client = createClient({
		handler: () => Promise.reject(error),
	});
	const { result, waitForNextUpdate } = renderHook<FetchRequest>(
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
	const { rerender } = renderHook<FetchRequest>(
		() => useFetch({}),
		client
	);

	rerender();
	rerender();
	rerender();

	expect(fetch).toBeCalledTimes(1);
});

test('should unsubscribe on unmount', async () => {
	let unsubscribe: any;
	const originalFetch = client.fetch;

	client.fetch = (...args) => {
		const sub = originalFetch(...args);
		unsubscribe = jest.spyOn(sub, 'unsubscribe');
		return sub;
	};

	renderHook<FetchRequest>(() => useFetch({}), client).unmount();

	expect(unsubscribe).toBeCalledTimes(1);
});

describe('cancel', () => {
	test('should cancel request when called', async () => {
		const { result } = renderHook<FetchRequest>(
			() => useFetch({}),
			client
		);

		expect(result.current.state).toEqual('pending');

		act(() => {
			result.current.cancel();
		});

		expect(result.current.state).toEqual('cancelled');
	});
});
