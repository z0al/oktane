// Packages
import equal from 'dequal';
import is from '@sindresorhus/is';
import { useState, useEffect, useRef } from 'react';

// Ours
import { State } from '../utils/state';
import { useClient } from './useClient';
import { buildRequest, Request } from '../request';

export type FetchResult = {
	state: State;
	data?: any;
	error?: any;
};

export type FetchUtils = {
	cancel: () => void;
	hasMore: () => boolean;
	fetchMore: () => void;
};

export type FetchResponse = FetchResult & FetchUtils;
export type FetchRequest =
	| Partial<Request>
	| (() => Partial<Request> | null | undefined);

export function useFetch(options: FetchRequest): FetchResponse {
	let request: Request;

	if (is.function_(options)) {
		options = options();

		if (options !== null && options !== undefined) {
			request = buildRequest(options);
		}
	} else {
		request = buildRequest(options);
	}

	// Fetch result & utils
	const utilsRef = useRef<FetchUtils>(null);
	const [result, setResult] = useState<FetchResult>(null);

	const client = useClient();

	useEffect((): any => {
		if (!request) {
			return;
		}

		const { unsubscribe, ...utils } = client.fetch(
			request,
			(state, data, error) => {
				const update = { data, state, error };
				if (!equal(result, update)) {
					setResult(update);
				}
			}
		);

		// Keep a ref to utils be able to call them later
		utilsRef.current = utils;

		return unsubscribe;
	}, [request?.id]);

	return {
		...result,
		...utilsRef.current,
	};
}
