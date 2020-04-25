declare global {
	var __DEV__: boolean;
}

// Core
export { Client, createClient } from './client';
export { Request, createRequest } from './request';

// React
export { useQuery, useRequest } from './react/fetchers';
export { useClient, ClientProvider } from './react/useClient';

// Typings
export { Status } from './utils/status';
export { Result, Cache } from './utils/cache';
export { Plugin, PluginOptions } from './utils/plugins';
