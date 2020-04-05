// Packages
import React from 'react';
import invariant from 'tiny-invariant';

// Ours
import { ClientContext } from './types';

export function useClient() {
	const client = React.useContext(ClientContext);

	invariant(client, 'could not find "client" in context');

	return client;
}
