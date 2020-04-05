// Packages
import React from 'react';

// Ours
import { Client } from '../client';

export type FetchArgs = {
	id?: string;
	[x: string]: any;
};

export const ClientContext = React.createContext<Client>(null);
