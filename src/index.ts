declare global {
	var __DEV__: boolean;
}

export { Client, createClient } from './client';
export { useFetch, useClient, ClientProvider } from './react';
export { Request, buildRequest } from './request';

export { State } from './utils/state';
export { Result } from './utils/cache';
export { Exchange, ExchangeOptions } from './utils/exchanges';
