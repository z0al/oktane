import React from 'react';
import { ClientProvider } from 'oktane';

import client from './client';
import Stories from './Stories';

const App = () => (
	<ClientProvider value={client}>
		<Stories />
	</ClientProvider>
);

export default App;
