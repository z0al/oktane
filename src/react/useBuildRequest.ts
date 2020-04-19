// Packages
import { useRef, useMemo } from 'react';

// Ours
import is from '../utils/is';
import { buildRequest, Request } from '../request';

export function useBuildRequest(body: any): Request {
	const prev = useRef<Request>(undefined);

	return useMemo(() => {
		let request: Request;

		// is ready?
		if (is.func(body)) {
			try {
				// eslint-disable-next-line
				body = body();
			} catch {
				body = false;
			}
		}

		if (body) {
			request = buildRequest(body);
		}

		// If the request id changed then we have a new request
		if (prev.current?.id !== request?.id) {
			prev.current = request;
		}

		return prev.current;
	}, [body]);
}
