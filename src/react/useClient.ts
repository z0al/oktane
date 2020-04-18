// Packages
import invariant from 'tiny-invariant';
import { createContext, useContext } from 'react';

// Ours
import { Client } from '../client';

const ClientContext = createContext<Client>(null);
export const ClientProvider = ClientContext.Provider;

/**
 *
 */
export function useClient() {
	const client = useContext(ClientContext);

	invariant(client, 'could not find "client" in context');

	return client;
}
