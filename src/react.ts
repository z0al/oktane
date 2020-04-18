// Packages
import React from 'react';
import deepEqual from 'dequal';
import invariant from 'tiny-invariant';

// Ours
import is from './utils/is';
import { Client } from './client';
import { Result } from './utils/cache';
import { Request, buildRequest } from './request';

interface FetchActions {
	cancel: () => void;
	hasMore: () => boolean;
	fetchMore: () => void;
}

// interface ManualFetchActions {
// 	fetch: ()=> void
// }

type FetchRequest =
	| Partial<Request>
	| (() => Partial<Request> | false | 0 | '' | null);

const ClientContext = React.createContext<Client>(null);
export const ClientProvider = ClientContext.Provider;

/**
 *
 */
export function useClient() {
	const client = React.useContext(ClientContext);

	invariant(client, 'could not find "client" in context');

	return client;
}

/**
 *
 * @param config
 */
function useBuildRequest(config: FetchRequest): Request | undefined {
	const prev = React.useRef<Request>(undefined);

	return React.useMemo(() => {
		let request: Request;

		// config is a function when working with dependent requests
		const options = is.func(config) ? config() : config;

		if (options) {
			request = buildRequest(options);
		}

		// If the request id changed then we have a new request
		if (prev.current?.id !== request?.id) {
			prev.current = request;
		}

		return prev.current;
	}, [config]);
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
		// TODO: is manual don't fetch
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
	const cancel = () => {
		actions.current?.cancel();
	};

	const hasMore = () => {
		return Boolean(actions.current?.hasMore());
	};

	const fetchMore = () => {
		if (!hasMore()) {
			// This prevents potential infinite loops in user's code.
			invariant(
				false,
				'can not fetch more data at the moment. ' +
					'Make sure to guard calls to fetchMore() with hasMore().'
			);
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

// Notes
// add something like buildFetch that takes config (current only manual)
// build useFetch with manual false
// and useRequest with manual true
// in buildFetch
// -
/**
 *
 * @param config
 */
