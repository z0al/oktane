// Packages
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

	if (!client) {
		throw new Error('could not find "client" in context');
	}

	return client;
}
