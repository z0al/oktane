// Packages
import equal from 'dequal';
import is from '@sindresorhus/is';
import invariant from 'tiny-invariant';
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

export type FetchActions = {
	cancel: () => void;
	hasMore: () => boolean;
	fetchMore: () => void;
};

export type FetchResponse = FetchResult & FetchActions;
export type FetchRequest =
	| Partial<Request>
	| (() => Partial<Request> | null | undefined);

const NotAllowed =
	'calling hasMore() or fetchMore() is not allowed when the ' +
	'request is not ready. Did you forget to call fetch()?';

/**
 *
 * @param options
 */
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

	// Fetch result & actions
	const actions = useRef<FetchActions>(null);
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

		// Keep a ref to actions be able to call them later
		actions.current = utils;

		return unsubscribe;
	}, [request?.id]);

	const cancel = () => {
		actions.current?.cancel();
	};

	const hasMore = () => {
		if (!actions.current) {
			invariant(false, NotAllowed);
		}

		return actions.current.hasMore();
	};

	const fetchMore = () => {
		if (!actions.current) {
			invariant(false, NotAllowed);
		}

		actions.current.fetchMore();
	};

	return {
		...result,
		cancel,
		hasMore,
		fetchMore,
	};
}
