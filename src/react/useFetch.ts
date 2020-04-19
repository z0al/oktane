// Packages
import React from 'react';
import deepEqual from 'dequal';

// Ours
import { Result } from '../utils/cache';
import { useClient } from './useClient';
import { useBuildRequest } from './useBuildRequest';

interface FetchActions {
	cancel: () => void;
	refetch: () => void;
	hasMore: () => boolean;
	fetchMore: () => void;
}

/**
 *
 * @param body
 */
export function useFetch(body: any): Result & FetchActions {
	// Fetch result & actions
	const actions = React.useRef<FetchActions>(null);
	const [result, setResult] = React.useState<Result>({
		status: 'pending',
	});

	const client = useClient();
	const request = useBuildRequest(body);

	React.useEffect((): any => {
		// request can be undefined if not ready
		if (!request) {
			return;
		}

		const { unsubscribe, ...utils } = client.fetch(
			request,
			(update) => {
				setResult((current) =>
					deepEqual(current, update) ? current : update
				);
			}
		);

		// Keep a ref to actions be able to call them later
		actions.current = utils;

		return unsubscribe;
	}, [client, request]);

	// Actions
	const cancel = React.useCallback(() => {
		if (actions.current) {
			actions.current.cancel();
		}
	}, [actions]);

	const refetch = React.useCallback(() => {
		if (actions.current) {
			actions.current.refetch();
		}
	}, [actions]);

	const hasMore = React.useCallback(() => {
		if (actions.current) {
			return actions.current.hasMore();
		}

		return false;
	}, [actions]);

	const fetchMore = React.useCallback(() => {
		if (actions.current) {
			actions.current.fetchMore();
		}
	}, [actions]);

	return {
		...result,
		cancel,
		refetch,
		hasMore,
		fetchMore,
	};
}
