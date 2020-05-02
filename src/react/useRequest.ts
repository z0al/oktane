// Packages
import { useRef, useMemo } from 'react';

// Ours
import is from '../utils/is';
import { createRequest, Request } from '../request';

export function useRequest(query: any): Request {
	const prev = useRef<Request>(undefined);

	return useMemo(() => {
		let request: Request;

		// is ready?
		if (is.func(query)) {
			try {
				// eslint-disable-next-line
				query = query();
			} catch {
				query = false;
			}
		}

		if (query) {
			request = createRequest(query);
		}

		// If the request id changed then we have a new request
		if (prev.current?.id !== request?.id) {
			prev.current = request;
		}

		return prev.current;
	}, [query]);
}
