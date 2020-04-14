declare global {
	var __DEV__: boolean;
}

export { createClient } from './client';
export { useFetch, useClient, ClientProvider } from './react';
