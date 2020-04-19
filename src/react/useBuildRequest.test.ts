// Packages
import { renderHook } from '@testing-library/react-hooks';

// Ours
import { useBuildRequest } from './useBuildRequest';

test('should return undefined if body is falsy', () => {
	const { result, rerender } = renderHook((body) =>
		useBuildRequest(body)
	);

	expect(result.current).toEqual(undefined);

	rerender(() => false);
	expect(result.current).toEqual(undefined);
});

test('should preserve object if id has not changed', () => {
	let body: any = {
		query: 'users',
		variables: {
			page: 1,
		},
	};

	const { result, rerender } = renderHook(
		({ body }) => useBuildRequest(body),
		{ initialProps: { body } }
	);

	const resultA = result.current;
	expect(resultA).toEqual({
		id: expect.any(String),
		body: body,
	});

	// changed reference
	body = {
		variables: { page: 1 },
		query: 'users',
	};

	rerender({ body });

	const resultB = result.current;
	expect(resultA).toBe(resultB);

	// changed values
	body = { ...body, changed: true };
	rerender({ body });

	const resultC = result.current;
	expect(resultA).not.toBe(resultC);
});

test('should not fail if error is thrown when resolving body', () => {
	const request: any = null;
	const { result } = renderHook(() =>
		useBuildRequest(() => request.body)
	);

	expect(result.current).toEqual(undefined);
	expect(result.error).toEqual(undefined);
});
