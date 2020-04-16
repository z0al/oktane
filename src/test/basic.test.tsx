// Packages
import React from 'react';
import { render, waitFor } from '@testing-library/react';

// Ours
import { wrap } from './utils';
import { createClient, useFetch } from '..';

const fetch = () => {
	return 'OK';
};

const client = createClient({ fetch });

const Example = wrap(() => {
	const { state, data = 'PENDING', error } = useFetch({});

	return (
		<div data-testid="message">
			{state === 'failed' ? `${error}` : data}
		</div>
	);
}, client);

test('Basic Example', async () => {
	const { container } = render(<Example />);

	expect(container).toHaveTextContent('PENDING');

	await waitFor(() => expect(container).toHaveTextContent('OK'));
});
