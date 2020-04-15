// Packages
import invariant from 'tiny-invariant';
import stringify from 'fast-safe-stringify';

// Ours
import is from './utils/is';

export interface Request {
	id: string;
	type?: never;
	[x: string]: any;
}

export const buildRequest = (req: Partial<Request>): Request => {
	invariant(is.plainObject(req), 'request must be a plain object');

	invariant(
		!('type' in req),
		'request.type is reserved for potential future use'
	);

	if (!is.nullish(req.id)) {
		invariant(
			is.string(req.id) && req.id !== '',
			'request.id must be a non-empty string or null or undefined'
		);
	}

	// Stringify everything but the `id`.
	const id = req.id || stringify.stable({ ...req, id: '' });

	return { ...req, id };
};
