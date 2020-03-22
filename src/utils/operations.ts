// Ours
import { Request } from '../request';

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
	data: unknown,
	meta: Meta = {}
) => ({
	type: 'buffer' as 'buffer',
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
 * Metadata to be used by e.g. devtools
 */
export interface Meta {
	// TODO: add source?
}

/**
 * Operation type
 */
export type Operation =
	| ReturnType<typeof $fetch>
	| ReturnType<typeof $cancel>
	| ReturnType<typeof $reject>
	| ReturnType<typeof $buffer>
	| ReturnType<typeof $complete>
	| ReturnType<typeof $dispose>;
