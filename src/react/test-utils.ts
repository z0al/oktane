// Packages
import React from 'react';
import { renderHook as render } from '@testing-library/react-hooks';

// Ours
import { Client } from '../client';
import { ClientContext } from './types';

export const renderHook = <R>(
	cb: (props: unknown) => R,
	client?: Client
) =>
	render<any, R>(cb, {
		wrapper: ({ children }) =>
			React.createElement(
				ClientContext.Provider,
				{ value: client },
				children
			),
	});

export { act } from '@testing-library/react-hooks';
