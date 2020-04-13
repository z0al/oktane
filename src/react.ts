// Packages
import React from 'react';
import equal from 'dequal';
import is from '@sindresorhus/is';
import invariant from 'tiny-invariant';

// Ours
import { Client } from './client';
import { buildRequest } from './request';
import { Request, Entry } from './utils/types';

type FetchActions = {
	cancel: () => void;
	hasMore: () => boolean;
	fetchMore: () => void;
};

type FetchResponse = Entry & FetchActions;
type FetchRequest =
	| Partial<Request>
	| (() => Partial<Request> | null | undefined);

const NotAllowed =
	'calling hasMore() or fetchMore() is not allowed when the ' +
	'request is not ready. Did you forget to call fetch()?';

export const ClientContext = React.createContext<Client>(null);

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
