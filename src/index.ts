declare global {
	var __DEV__: boolean;
}

// Core
export { Client, createClient } from './client';
export { Request, createRequest } from './request';

// React
export { useQuery, useManualQuery } from './react/query';
export { useClient, ClientProvider } from './react/useClient';

// Typings
export { Status } from './utils/status';
export { Result, Cache } from './utils/cache';
export { Plugin, PluginOptions } from './plugins/api';
