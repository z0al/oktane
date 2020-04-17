// Packages
import React from 'react';
import delay from 'delay';
import { render, waitFor, act } from '@testing-library/react';

// Ours
import { createClient } from './client';
import { buildRequest } from './request';
import { useClient, useFetch } from './react';
import { wrap, spyOnFetch } from './test/utils';

describe('useClient', () => {
	test('should throw if client is not set', () => {
		const Example = wrap(() => {
			useClient();
			return null;
		}, undefined);

		expect(() => {
			// suppress logging
			const log = console.error;
			console.error = () => {};

			render(<Example />, {});

			console.error = log;
		}).toThrow(/could not find "client"/);
	});
});

describe('useFetch', () => {
	let fetch: any;

	beforeEach(() => {
		fetch = jest.fn().mockImplementation(async () => {
			await delay(10);
			return 'OK';
		});
	});

	test('should sync request state & response', async () => {
		const client = createClient({ fetch });

		const Example = wrap(() => {
			const { state, data } = useFetch({});

			return <p>{state !== 'completed' ? state : data}</p>;
		}, client);

		const { container } = render(<Example />);

		expect(container).toHaveTextContent('pending');
		await waitFor(() => expect(container).toHaveTextContent('OK'));
	});

	test('should report errors', async () => {
		const error = new Error();
		const client = createClient({
			fetch: () => Promise.reject(error),
		});

		const Example = wrap(() => {
			const { state, error } = useFetch({});

			if (state === 'failed') {
				return <p>{error.message}</p>;
			}

			if (state === 'pending') {
				return <p>{state}</p>;
			}

			return null;
		}, client);

		const { container } = render(<Example />);

		expect(container).toHaveTextContent('pending');
		await waitFor(() =>
			expect(container).toHaveTextContent(error.message)
		);
	});

	test('should deduplicate requests', async () => {
		const client = createClient({ fetch });

		const Example = wrap(() => {
			useFetch({});
			useFetch({});
			useFetch({});
			useFetch({});
			useFetch({});
			const { state, data } = useFetch({});

			return <p>{state !== 'completed' ? state : data}</p>;
		}, client);

		const { container } = render(<Example />);

		expect(container).toHaveTextContent('pending');
		await waitFor(() => expect(container).toHaveTextContent('OK'));

		expect(fetch).toHaveBeenCalledTimes(1);
	});

	test('should unsubscribe on unmount', async () => {
		const client = createClient({ fetch });
		const spy = spyOnFetch(client);

		const Example = wrap(() => {
			const { state, data } = useFetch({});

			return <p>{state !== 'completed' ? state : data}</p>;
		}, client);

		const { container, unmount } = render(<Example />);

		await waitFor(() => expect(container).toHaveTextContent('OK'));
		unmount();

		expect(spy.unsubscribe).toHaveBeenCalledTimes(1);
	});

	test('should wait for request dependencies', async () => {
		fetch = jest.fn().mockImplementation(async ({ query }) => {
			await delay(10);

			if (query === 'user') {
				return { id: 1, name: 'Jason Miller' };
			}

			if (query === 1) {
				return 'Web DevRel @google';
			}

			return null;
		});

		const client = createClient({ fetch });

		const Example = wrap(() => {
			const { data: user } = useFetch({ query: 'user' });
			const { data: bio } = useFetch(
				() => user?.id && { query: user.id }
			);

			return <p>{`${user?.name}: ${bio}`}</p>;
		}, client);

		const { container } = render(<Example />);

		expect(fetch).toHaveBeenCalledTimes(1);
		await waitFor(() =>
			expect(container).toHaveTextContent('Jason Miller:')
		);

		expect(fetch).toHaveBeenCalledTimes(2);
		await waitFor(() =>
			expect(container).toHaveTextContent(
				'Jason Miller: Web DevRel @google'
			)
		);
	});

	test('should respect prefetched requests', async () => {
		const client = createClient({ fetch });

		// prefetch and wait for response
		client.prefetch(buildRequest({ url: '/api' }));
		await delay(15);

		const Example = wrap(() => {
			const { state, data } = useFetch({ url: '/api' });

			return <p>{state !== 'completed' ? state : data}</p>;
		}, client);

		const { container } = render(<Example />);

		expect(container).toHaveTextContent('OK');
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	describe('cancel()', () => {
		test('should cancel request', async () => {
			const client = createClient({ fetch });
			const spy = spyOnFetch(client);

			const Example = wrap(() => {
				const { state, cancel } = useFetch({});

				return (
					<div>
						{state}
						<button
							data-testid="cancel"
							onClick={() => cancel()}
						></button>
					</div>
				);
			}, client);

			const { container, getByTestId } = render(<Example />);

			expect(container).toHaveTextContent('pending');

			act(() => {
				getByTestId('cancel').click();
			});

			expect(container).toHaveTextContent('cancelled');
			expect(spy.cancel).toHaveBeenCalled();
		});
	});

	describe('hasMore()', () => {
		test('should NOT throw if called too early', async () => {
			const client = createClient({ fetch });

			const Example = wrap(() => {
				const { state, hasMore } = useFetch(() => false);

				return (
					<div>
						{state}
						<button
							data-testid="hasMore"
							onClick={() => hasMore()}
						></button>
					</div>
				);
			}, client);

			const { container, getByTestId } = render(<Example />);

			expect(container).toHaveTextContent('pending');

			expect(() => {
				act(() => {
					getByTestId('hasMore').click();
				});
			}).not.toThrow();
		});
	});

	describe('fetchMore()', () => {
		test.skip('should throw if it is not possible to fetch more', async () => {
			const client = createClient({ fetch });

			const Example = wrap(() => {
				const { state, fetchMore } = useFetch({});
				return (
					<div>
						{state}
						<button
							data-testid="fetchMore"
							onClick={() => fetchMore()}
						></button>
					</div>
				);
			}, client);

			const { container, getByTestId } = render(<Example />);

			expect(container).toHaveTextContent('pending');

			expect(() => {
				act(() => {
					getByTestId('fetchMore').click();
				});
			}).toThrow(/can not fetch/i);
		});
	});
});
