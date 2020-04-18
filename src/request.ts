// Packages
import invariant from 'tiny-invariant';

// Ours
import is from './utils/is';

export interface Request {
	id: string;
	type?: never;
	[x: string]: any;
}

const stabilize = (_: string, value: any) => {
	if (typeof value === 'object' && !Array.isArray(value)) {
		return Object.keys(value)
			.sort()
			.reduce((prev, next) => {
				return { ...prev, [next]: value[next] };
			}, {});
	}

	return value;
};

export const buildRequest = (request: Partial<Request>): Request => {
	invariant(is.plainObject(request), 'request must be a plain object');

	invariant(
		!('type' in request),
		'request.type is reserved for potential future use'
	);

	if (!is.nullish(request.id)) {
		invariant(
			is.string(request.id) && request.id !== '',
			'request.id must be a non-empty string or null or undefined'
		);
	}

	// Stringify everything but the `id`.
	let { id, ...info } = request;
	id = id || JSON.stringify(info, stabilize);

	return { ...request, id };
};
