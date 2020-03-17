// Ours
import { Request } from '../utils/request';

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

export const $buffer = (
	request: Request,
	data: FetchResult,
	meta: Meta = {}
) => ({
	type: 'buffer' as 'buffer',
	payload: { request, data },
	meta,
});

export const $complete = (
	request: Request,
	data?: FetchResult,
	meta: Meta = {}
) => ({
	type: 'complete' as 'complete',
	payload: { request, data },
	meta,
});

/**
 * Metadata to be used by e.g. devtools
 */
export interface Meta {
	// TODO: add source?
}

export interface FetchResult {
	// TODO
}

/**
 * Operation type
 */
export type Operation =
	| ReturnType<typeof $fetch>
	| ReturnType<typeof $cancel>
	| ReturnType<typeof $reject>
	| ReturnType<typeof $buffer>
	| ReturnType<typeof $complete>;
