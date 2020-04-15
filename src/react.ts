// Packages
import React from 'react';
import equal from 'dequal';
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

const NotReadyError =
	'calling hasMore() or fetchMore() is not allowed when ' +
	'the request is not ready. Did you forget to call fetch()?';

/**
 *
 * @param config
 */
export function useFetch(config: FetchRequest): Result & FetchActions {
	let request: Request;

	if (is.func(config)) {
		const opt = config();

		// It's not ready if config() returned a falsy value
		if (opt) {
			request = buildRequest(opt);
		}
	} else {
		request = buildRequest(config);
	}

	// Fetch result & actions
	const actions = React.useRef<FetchActions>(null);
	const [result, setResult] = React.useState<Result>(null);

	const client = useClient();

	React.useEffect((): any => {
		// TODO: is manual don't fetch
		if (!request) {
			return;
		}

		const { unsubscribe, ...utils } = client.fetch(
			request,
			(update) => {
				if (!equal(result, update)) {
					setResult(update);
				}
			}
		);

		// Keep a ref to actions be able to call them later
		actions.current = utils;

		return unsubscribe;
	}, [request?.id]);

	// export fetch
	// const fetch = () => {
	// if not manual ? throw. or event better. don't export
	// otherwise, call
	// }
	const cancel = () => {
		actions.current?.cancel();
	};

	const hasMore = () => {
		if (!actions.current) {
			invariant(false, NotReadyError);
		}

		return actions.current.hasMore();
	};

	const fetchMore = () => {
		if (!actions.current) {
			invariant(false, NotReadyError);
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
