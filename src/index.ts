declare global {
	var __DEV__: boolean;
}

export { Client, createClient } from './client';
export { Request, buildRequest } from './request';
export { useFetch, useClient, ClientProvider } from './react';

export { State } from './utils/state';
export { Result } from './utils/cache';
export { Exchange, ExchangeOptions } from './utils/exchanges';
