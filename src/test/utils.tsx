import React from 'react';

// Ours
import { ClientProvider, Client } from '..';

export const wrap = (
	Component: React.FunctionComponent,
	client: Client
) => () => (
	<ClientProvider value={client}>
		<Component />
	</ClientProvider>
);
