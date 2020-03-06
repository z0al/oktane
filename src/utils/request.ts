// Packages
import invariant from 'tiny-invariant';
import stringify from 'fast-safe-stringify';

export interface Request {
	id?: string;
	query: any;
	variables?: any;
	type: 'query' | 'mutation' | 'subscription';
}

export interface Response {
	data?: any;
	request: Pick<Request, 'id' | 'type'>;
}

export const createRequest = (req: Request): Request => {
	invariant(req.type, 'request must have a type');
	invariant(req.query, 'request must have a query');

	const keys = {
		type: req.type,
		query: req.query,
		variables: req.variables,
	};

	return { ...keys, id: req.id || stringify(keys) };
};
