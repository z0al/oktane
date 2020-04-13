// Packages
import React from 'react';
import equal from 'dequal';
import invariant from 'tiny-invariant';

// Ours
import is from './utils/is';
import { Client } from './client';
import { buildRequest } from './request';
import { Request, Entry } from './utils/types';

type FetchActions = {
	cancel: () => void;
	hasMore: () => boolean;
	fetchMore: () => void;
};

type Query = Entry & FetchActions;
type ManualQuery = Query & { fetch: () => void };

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
export function useFetch(config: FetchRequest): Query {
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
	const [result, setResult] = React.useState<Entry>(null);

	const client = useClient();

	React.useEffect((): any => {
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

/**
 *
 * @param config
 */
export function useRequest(config: Partial<Request>): ManualQuery {
	const [isReady, setReady] = React.useState(false);

	if (!is.plainObject(config)) {
		invariant(
			false,
			`(useRequest) expected 'config' to be a plain object. ` +
				`Got: ${typeof config}`
		);
	}

	// delay fetch until manually triggered
	const query = useFetch(() => isReady && config);

	const fetch = () => {
		if (!isReady) {
			return setReady(true);
		}

		invariant(false, '(useRequest) fetch is called more than once.');
	};

	return { ...query, fetch };
}
