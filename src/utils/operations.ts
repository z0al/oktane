// Ours
import { Request } from './../request';

export type OperationType =
	| 'fetch'
	| 'cancel'
	| 'reject'
	| 'put'
	| 'complete'
	| 'dispose';

export interface Meta {
	// Lazy source?
	lazy?: boolean;
}

export interface Operation {
	type: OperationType;
	payload: {
		request: Request;
		data?: any;
		error?: any;
	};
	meta: Meta;
}

/**
 * Create operation
 *
 * @param type
 * @param payload
 * @param meta
 */
export const $ = (
	type: OperationType,
	payload: {
		request: Request;
		data?: any;
		error?: any;
	},
	meta: Meta = {}
): Operation => ({
	type,
	payload,
	meta,
});
