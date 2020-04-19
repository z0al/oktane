// Packages
import React from 'react';
import delay from 'delay';
import { render, waitFor, act } from '@testing-library/react';

// Ours
import { useFetch } from './useFetch';
import { createClient } from '../client';
import { buildRequest } from '../request';
import { wrap, spyOnFetch } from './test/utils';

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

test('should cancel request when asked to', async () => {
	const client = createClient({ fetch });

	const Example = wrap(() => {
		const { state, cancel } = useFetch({});

		return (
			<div>
				<p>{state}</p>
				<button data-testid="cancel" onClick={() => cancel()}></button>
			</div>
		);
	}, client);

	const { container, getByTestId } = render(<Example />);

	expect(container).toHaveTextContent('pending');

	act(() => {
		getByTestId('cancel').click();
	});

	await waitFor(() => expect(container).toHaveTextContent('cancelled'));
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
		const { state, data } = useFetch({ url: '/api' });

		return <p>{state !== 'completed' ? state : data}</p>;
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

describe('actions', () => {
	test('should NOT throw if called too early', async () => {
		const client = createClient({ fetch });

		const Example = wrap(() => {
			const { state, cancel, refetch, hasMore, fetchMore } = useFetch(
				() => false
			);

			return (
				<div>
					{state}
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
