import React from 'react';
import { ClientProvider } from 'oktane';

import client from './client';
import Issues from './Issues';

const App = () => (
	<ClientProvider value={client}>
		<Issues />
	</ClientProvider>
);

export default App;
