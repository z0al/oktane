// Packages
import { useRef, useMemo } from 'react';

// Ours
import is from '../utils/is';
import { buildRequest, Request } from '../request';

export type FetchRequest =
	| Partial<Request>
	| (() => Partial<Request> | false | 0 | '' | null);

export function useBuildRequest(_request: FetchRequest): Request {
	const prev = useRef<Request>(undefined);

	return useMemo(() => {
		let request: Request;

		// _request is a function when working with dependent requests
		const options = is.func(_request) ? _request() : _request;

		if (options) {
			request = buildRequest(options);
		}

		// If the request id changed then we have a new request
		if (prev.current?.id !== request?.id) {
			prev.current = request;
		}

		return prev.current;
	}, [_request]);
}
