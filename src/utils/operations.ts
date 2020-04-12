// Ours
import { Request } from './types';

export const $fetch = (request: Request, meta: Meta = {}) => ({
	type: 'fetch' as 'fetch',
	payload: { request },
	meta,
});

export const $cancel = (request: Request, meta: Meta = {}) => ({
	type: 'cancel' as 'cancel',
	payload: { request },
	meta,
});

export const $reject = (
	request: Request,
	error: unknown,
	meta: Meta = {}
) => ({
	type: 'reject' as 'reject',
	payload: { request, error },
	meta,
});

export const $put = (
	request: Request,
	data: unknown,
	meta: Meta = {}
) => ({
	type: 'put' as 'put',
	payload: { request, data },
	meta,
});

export const $complete = (
	request: Request,
	data?: unknown,
	meta: Meta = {}
) => ({
	type: 'complete' as 'complete',
	payload: { request, data },
	meta,
});

export const $dispose = (request: Request, meta: Meta = {}) => ({
	type: 'dispose' as 'dispose',
	payload: { request },
	meta,
});

/**
 * Request Metadata
 */
export interface Meta {
	// lazy stream?
	lazy?: boolean;
}

/**
 * Operation type
 */
export type Operation =
	| ReturnType<typeof $fetch>
	| ReturnType<typeof $cancel>
	| ReturnType<typeof $reject>
	| ReturnType<typeof $put>
	| ReturnType<typeof $complete>
	| ReturnType<typeof $dispose>;
