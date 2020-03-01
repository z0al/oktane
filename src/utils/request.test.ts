// Ours
import { createRequest, Request } from './request';

test('should throw if type is not set', () => {
	expect(() => {
		createRequest({ query: 'test' } as Request);
	}).toThrow(/type/);
});

test('should throw if query is not set', () => {
	expect(() => {
		createRequest({ type: 'query' } as Request);
	}).toThrow(/query/);
});

test('should serialize identical queries identically', () => {
	const reqA = createRequest({ query: 'test', type: 'query' });
	const reqB = createRequest({ query: 'test', type: 'query' });

	expect(reqA.id).toBe(reqB.id);
});

test('should serialize the query, variables and type', () => {
	const reqA = { query: 'test', type: 'query', variables: [1, 2] };
	const reqB = { query: 'test', type: 'mutation', variables: {} };

	const idA = createRequest(reqA as Request).id;
	const idB = createRequest(reqB as Request).id;

	expect(JSON.parse(idA)).toEqual(reqA);
	expect(JSON.parse(idB)).toEqual(reqB);
});

test('should not serialize if req.id is truthy', () => {
	const req = createRequest({
		id: '__id__',
		query: 'test',
		type: 'query',
	});

	expect(req.id).toEqual('__id__');
});
