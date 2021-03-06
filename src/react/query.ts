// Packages
import React from 'react';
import deepEqual from 'dequal';

// Ours
import is from '../utils/is';
import { Client } from '../client';
import { Result } from '../utils/cache';
import { useClient } from './useClient';
import { useRequest } from './useRequest';

interface QueryOperations {
	fetch?: () => void;
	cancel: () => void;
	refetch: () => void;
	hasMore: () => boolean;
	fetchMore: () => void;
}

function createQueryHook(
	manual: false
): (query: any) => Result & Omit<QueryOperations, 'fetch'>;
function createQueryHook(
	manual: true
): (query: any) => Result & Required<QueryOperations>;
function createQueryHook(manual: boolean) {
	return (query: any) => {
		if (manual && is.func(query)) {
			throw new Error('useManualQuery() does not accept a function');
		}

		// Fetch response
		const [response, setResponse] = React.useState<Result>({
			status: manual ? 'idle' : 'pending',
		});

		// Operations exposed from the lastest call to client.fetch()
		const fns = React.useRef<ReturnType<Client['fetch']>>(null);

		const client = useClient();
		const request = useRequest(query);

		const fetch = React.useCallback(() => {
			// bail out if request is not ready
			if (!request) {
				return;
			}

			fns.current = client.fetch(request, (update) => {
				setResponse((current) =>
					deepEqual(current, update) ? current : update
				);
			});
		}, [client, request]);

		const cancel = React.useCallback(() => {
			if (fns.current) {
				fns.current.cancel();
			}
		}, [fns]);

		const refetch = React.useCallback(() => {
			if (fns.current) {
				fns.current.refetch();
			}
		}, [fns]);

		const hasMore = React.useCallback(() => {
			if (fns.current) {
				return fns.current.hasMore();
			}

			return false;
		}, [fns]);

		const fetchMore = React.useCallback(() => {
			if (fns.current) {
				fns.current.fetchMore();
			}
		}, [fns]);

		// Automatically:
		// - fetch on mount (skip manual requests)
		// - unsubscribe on unmount
		React.useEffect((): any => {
			if (!manual) {
				fetch();
			}

			return () => {
				if (fns.current) {
					fns.current.unsubscribe();
				}
			};
		}, [fetch]);

		// Exposed interface
		const exposed: Result & QueryOperations = {
			...response,
			cancel,
			refetch,
			hasMore,
			fetchMore,
		};

		if (manual) {
			exposed.fetch = fetch;
		}

		return exposed;
	};
}

export const useQuery = createQueryHook(false);
export const useManualQuery = createQueryHook(true);
