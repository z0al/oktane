// Packages
import React from 'react';
import equal from 'dequal';

// Ours
import { FetchArgs } from './types';
import { State } from '../utils/state';
import { useClient } from './useClient';
import { createRequest } from '../request';

export interface Query {
	state: State;
	data?: any;
	error?: any;
	refetch: () => void;
	cancel: () => void;
}

export function useQuery(args: FetchArgs): Query {
	const [result, setResult] = React.useState({
		state: 'idle' as State,
	});

	const request = createRequest({
		...args,
		type: 'query',
	});

	const client = useClient();
	const cancelRef = React.useRef<() => void>();

	React.useEffect(() => {
		const { unsubscribe, cancel } = client.fetch(
			request,
			(state, data, error) => {
				const update = { data, state, error };
				if (!equal(result, update)) {
					setResult(update);
				}
			}
		);

		// Keep a ref to be able to call it outside this hook
		cancelRef.current = cancel;

		return unsubscribe;
	}, [request.id]);

	// Exposed helpers
	const refetch = () => client.fetch(request);
	const cancel = () => cancelRef.current?.();

	return { ...result, refetch, cancel };
}
