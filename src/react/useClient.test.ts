// Ours
import { renderHook } from './test-utils';

import { useClient } from './useClient';
import { createClient } from '../client';

test('should return client context value', () => {
	const client = createClient({ handler: jest.fn() });
	const { result } = renderHook(() => useClient(), client);

	expect(result.current).toEqual(client);
});

test('should throw if value is not set', () => {
	const { result } = renderHook(() => useClient());

	expect(result.error?.message).toMatch(/client/i);
});
