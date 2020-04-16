// Packages
import React from 'react';
import delay from 'delay';
import { render, waitFor } from '@testing-library/react';

// Ours
import { wrap } from './utils';
import { createClient, useFetch, buildRequest } from '..';

const fetch = jest.fn().mockImplementation(async () => {
	await delay(5);
	return 'OK';
});

const client = createClient({ fetch });

const Example = wrap(() => {
	const { state, data = 'PENDING', error } = useFetch({
		url: '/users',
	});

	return (
		<div data-testid="message">
			{state === 'failed' ? `${error}` : data}
		</div>
	);
}, client);

test('Prefetching Example', async () => {
	client.prefetch(buildRequest({ url: '/users' }));

	const { container } = render(<Example />);

	expect(container).toHaveTextContent('PENDING');

	await waitFor(() => expect(container).toHaveTextContent('OK'));

	expect(fetch).toBeCalledTimes(1);
});
