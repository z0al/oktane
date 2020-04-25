import React from 'react';
import { createClient, ClientProvider } from 'oktane';

import Todos from './Todos';

const client = createClient({
	fetch: ({ query }) => {
		return fetch(
			`https://jsonplaceholder.typicode.com/${query}?_limit=10`
		).then((res) => res.json());
	},
});

const App = () => (
	<ClientProvider value={client}>
		<Todos />
	</ClientProvider>
);

export default App;
