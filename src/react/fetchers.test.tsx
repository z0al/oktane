// Packages
import React from 'react';
import delay from 'delay';
import { renderHook } from '@testing-library/react-hooks';
import { render, waitFor, act } from '@testing-library/react';

// Ours
import { createClient } from '../client';
import { buildRequest } from '../request';
import { ClientProvider } from './useClient';
import { wrap, spyOnFetch } from './test/utils';
import { useFetch, useRequest } from './fetchers';

// @ts-ignore
global.__DEV__ = true;

let fetch: any;

beforeEach(() => {
	fetch = jest.fn().mockImplementation(async () => {
		await delay(10);
		return 'OK';
	});
});

describe('useFetch', () => {
	test('should sync request status & response', async () => {
		const client = createClient({ fetch });

		const Example = wrap(() => {
			const { status, data } = useFetch({});

			return <p>{status !== 'completed' ? status : data}</p>;
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
			const { status, error } = useFetch({});

			if (status === 'failed') {
				return <p>{error.message}</p>;
			}

			if (status === 'pending') {
				return <p>{status}</p>;
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
			const { status, data } = useFetch({});

			return <p>{status !== 'completed' ? status : data}</p>;
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
			const { status, data } = useFetch({});

			return <p>{status !== 'completed' ? status : data}</p>;
		}, client);

		const { container, unmount } = render(<Example />);

		await waitFor(() => expect(container).toHaveTextContent('OK'));
		unmount();

		expect(spy.unsubscribe).toHaveBeenCalledTimes(1);
	});

	test('should cancel request when asked to', async () => {
		const client = createClient({ fetch });

		const Example = wrap(() => {
			const { status, cancel } = useFetch({});

			return (
				<div>
					<p>{status}</p>
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

		await waitFor(() =>
			expect(container).toHaveTextContent('cancelled')
		);
	});

	test('should wait for request dependencies', async () => {
		fetch = jest.fn().mockImplementation(async ({ body }) => {
			await delay(10);

			if (body === 'user') {
				return { id: 1, name: 'Jason Miller' };
			}

			if (body === 1) {
				return 'Web DevRel @google';
			}

			return null;
		});

		const client = createClient({ fetch });

		const Example = wrap(() => {
			const { data: user } = useFetch('user');
			const { data: bio } = useFetch(() => user?.id);

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

	test('should respect prefetching', async () => {
		const client = createClient({ fetch });

		// prefetch and wait for response
		client.prefetch(buildRequest({ url: '/api' }));
		await delay(15);

		const Example = wrap(() => {
			const { status, data } = useFetch({ url: '/api' });

			return <p>{status !== 'completed' ? status : data}</p>;
		}, client);

		const { container } = render(<Example />);

		expect(container).toHaveTextContent('OK');
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	test('should paginate if possible', async () => {
		const fetch = () => {
			const gen = (function*() {
				yield 1;
				yield 2;
				return yield 3;
			})();

			return () => gen.next();
		};

		const client = createClient({ fetch });

		const Example = wrap(() => {
			const { data, hasMore, fetchMore } = useFetch({});

			return (
				<div>
					<p>{data}</p>
					<button
						data-testid="next"
						disabled={!hasMore()}
						onClick={() => fetchMore()}
					></button>
				</div>
			);
		}, client);

		const { container, getByTestId } = render(<Example />);

		await waitFor(() => expect(container).toHaveTextContent('1'));

		act(() => {
			getByTestId('next').click();
		});

		await waitFor(() => expect(container).toHaveTextContent('2'));

		act(() => {
			getByTestId('next').click();
		});

		await waitFor(() => expect(container).toHaveTextContent('3'));

		act(() => {
			getByTestId('next').click();
		});

		await waitFor(() => expect(getByTestId('next')).toBeDisabled());

		expect(container).toHaveTextContent('3');
	});

	describe('operations', () => {
		test('should NOT throw if called too early', async () => {
			const client = createClient({ fetch });

			const Example = wrap(() => {
				const {
					status,
					cancel,
					refetch,
					hasMore,
					fetchMore,
				} = useFetch(() => false);

				return (
					<div>
						{status}
						<button
							data-testid="cancel"
							onClick={() => cancel()}
						></button>
						<button
							data-testid="refetch"
							onClick={() => refetch()}
						></button>
						<button
							data-testid="hasMore"
							onClick={() => hasMore()}
						></button>
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
					getByTestId('cancel').click();
					getByTestId('refetch').click();
					getByTestId('hasMore').click();
					getByTestId('fetchMore').click();
				});
			}).not.toThrow();
		});
	});
});

describe.only('useRequest', () => {
	test('should only fetch on .fetch() call', async () => {
		const client = createClient({ fetch });

		const Example = wrap(() => {
			const { status, data, fetch } = useRequest('/api');

			return (
				<>
					<p>{status !== 'completed' ? status : data}</p>;
					<button data-testid="fetch" onClick={() => fetch()} />
				</>
			);
		}, client);

		const { container, rerender, getByTestId } = render(<Example />);

		rerender(<Example />);

		expect(container).toHaveTextContent('idle');
		expect(fetch).not.toHaveBeenCalled();

		// manually trigger fetch
		act(() => {
			getByTestId('fetch').click();
		});

		expect(container).toHaveTextContent('pending');
		await waitFor(() => expect(container).toHaveTextContent('OK'));
	});

	test('should throw if body is a function', () => {
		const client = createClient({ fetch });

		const { result } = renderHook(() => useRequest(() => '/api'), {
			wrapper: ({ children }) => (
				<ClientProvider value={client}>{children}</ClientProvider>
			),
		});

		expect(result.error?.message).toMatch(/not accept/);
	});
});
