// Packages
import equal from 'dequal';
import { useState, useEffect, useRef } from 'react';

// Ours
import { State } from '../utils/state';
import { useClient } from './useClient';
import { createRequest } from '../request';

type FetchResult = {
	state: State;
	data?: any;
	error?: any;
};

type FetchUtils = {
	cancel: () => void;
};

export type FetchOptions = Record<string, any>;
export type FetchRequest = FetchResult & FetchUtils;

export function useFetch(options: FetchOptions): FetchRequest {
	const request = createRequest(options);

	// Fetch result & utils
	const utilsRef = useRef<FetchUtils>(null);
	const [result, setResult] = useState<FetchResult>(null);

	const client = useClient();

	useEffect(() => {
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
	}, [request.id]);

	return {
		...result,
		...utilsRef.current,
	};
}
