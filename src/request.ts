// Packages
import is from '@sindresorhus/is';
import invariant from 'tiny-invariant';
import stringify from 'fast-safe-stringify';

// Ours
import { Request } from './utils/types';

export const buildRequest = (req: Partial<Request>): Request => {
	invariant(is.plainObject(req), 'request must be a plain object');

	invariant(
		!('type' in req),
		'request.type is reserved for potential future use'
	);

	if (!is.undefined(req.id)) {
		invariant(
			is.nonEmptyString(req.id),
			'request.id must be a non-empty string or unset'
		);
	}

	// Stringify everything but the `id`.
	const id = req.id || stringify.stable({ ...req, id: '' });

	return { ...req, id };
};
