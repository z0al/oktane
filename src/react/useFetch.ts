// Packages
import React from 'react';
import deepEqual from 'dequal';
import invariant from 'tiny-invariant';

// Ours
import { Result } from '../utils/cache';
import { useClient } from './useClient';
import { useBuildRequest, FetchRequest } from './useBuildRequest';

interface FetchActions {
	cancel: () => void;
	hasMore: () => boolean;
	fetchMore: () => void;
}

/**
 *
 * @param _request
 */
export function useFetch(
	_request: FetchRequest
): Result & FetchActions {
	// Fetch result & actions
	const actions = React.useRef<FetchActions>(null);
	const [result, setResult] = React.useState<Result>({
		state: 'pending',
	});

	const client = useClient();
	const request = useBuildRequest(_request);

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

	// export fetch
	// const fetch = () => {
	// if not manual ? throw. or event better. don't export
	// otherwise, call
	// }
	const cancel = React.useCallback(() => {
		if (actions.current) {
			actions.current.cancel();
		}
	}, [actions]);

	const hasMore = React.useCallback(() => {
		if (actions.current) {
			return actions.current.hasMore();
		}

		return false;
	}, [actions]);

	const fetchMore = React.useCallback(() => {
		if (!hasMore()) {
			// This prevents potential infinite loops in user's code.
			invariant(
				false,
				'can not fetch more data at the moment. ' +
					'Make sure to guard calls to fetchMore() with hasMore().'
			);
		}

		actions.current.fetchMore();
	}, [actions]);

	return {
		...result,
		cancel,
		hasMore,
		fetchMore,
	};
}
