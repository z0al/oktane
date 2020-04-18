// Packages
import { renderHook } from '@testing-library/react-hooks';

// Ours
import { useClient } from './useClient';

test('should throw if client is not set', () => {
	const { result } = renderHook(() => useClient());

	expect(result.error.message).toMatch(/could not find "client"/);
});
