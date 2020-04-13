declare global {
	var __DEV__: boolean;
}

export { createClient } from './client';
export { useFetch, useRequest, ClientProvider } from './react';
