import React from 'react';
import { ClientProvider } from 'oktane';

import './style.css';
import client from './client';
import Counter from './Counter';

const App = () => (
	<ClientProvider value={client}>
		<Counter />
	</ClientProvider>
);

export default App;
