// Packages
import React from 'react';
import { renderHook as render } from '@testing-library/react-hooks';

// Ours
import { Client } from '../client';
import { ClientProvider } from '../react';

export const renderHook = <R>(
	cb: (props: unknown) => R,
	client?: Client
) =>
	render<any, R>(cb, {
		wrapper: ({ children }) =>
			React.createElement(ClientProvider, { value: client }, children),
	});

export { act } from '@testing-library/react-hooks';
