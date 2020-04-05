// Packages
import React from 'react';

// Ours
import { Client } from '../client';
import { State } from '../utils/state';

export type Response = {
	data: any;
	error?: any;
	state: State;
};

export const ClientContext = React.createContext<Client>(null);
