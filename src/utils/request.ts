// Packages
import is from '@sindresorhus/is';
import invariant from 'tiny-invariant';
import stringify from 'fast-safe-stringify';

export interface Request {
	id?: string;
	type: 'query' | 'mutation' | 'stream';
	[x: string]: any;
}

export const createRequest = (req: Request): Request => {
	invariant(is.plainObject(req), 'request must be a plain object');
	invariant(
		is.string(req.type),
		'request.type must be either: "query", "mutation", or "stream'
	);

	if (!is.undefined(req.id)) {
		invariant(
			is.nonEmptyString(req.id),
			'request.id is optional. If set it must be a non-empty string'
		);
	}

	// Stringify everything except the `id`.
	const keys: Request = { ...req, id: '' };
	return { ...req, id: req.id || stringify(keys) };
};
