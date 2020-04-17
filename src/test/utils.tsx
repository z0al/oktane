import React from 'react';

// Ours
import { ClientProvider, Client } from '..';

export const wrap = (
	Component: React.FunctionComponent,
	client: Client
) => () => (
	<ClientProvider value={client}>
		<Component />
	</ClientProvider>
);

export const spyOnFetch = (client: Client) => {
	const fetch = client.fetch;

	const spy: any = {};

	client.fetch = (...args) => {
		const subscription = fetch(...args);

		spy.cancel = jest.spyOn(subscription, 'cancel');
		spy.hasMore = jest.spyOn(subscription, 'hasMore');
		spy.fetchMore = jest.spyOn(subscription, 'fetchMore');
		spy.unsubscribe = jest.spyOn(subscription, 'unsubscribe');

		return subscription;
	};

	return spy;
};
