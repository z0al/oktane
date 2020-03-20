// Ours
import { createRequest } from './request';

test('should throw if request.type is not set', () => {
	expect(() => {
		createRequest({} as any);
	}).toThrow(/request.type/);
});

test('should NOT throw if request.id is not set', () => {
	expect(() => {
		createRequest({ type: 'query' });
	}).not.toThrow();
});

test('should throw if request.id is set to an invalid value', () => {
	expect(() => {
		createRequest({ id: 1, type: 'query' } as any);
	}).toThrow(/request.id/);

	expect(() => {
		createRequest({ id: '', type: 'query' } as any);
	}).toThrow(/request.id/);

	expect(() => {
		createRequest({ id: true, type: 'query' } as any);
	}).toThrow(/request.id/);

	expect(() => {
		createRequest({ id: {}, type: 'query' } as any);
	}).toThrow(/request.id/);

	expect(() => {
		createRequest({ id: [], type: 'query' } as any);
	}).toThrow(/request.id/);

	expect(() => {
		createRequest({ id: false, type: 'query' } as any);
	}).toThrow(/request.id/);

	expect(() => {
		createRequest({ id: null, type: 'query' } as any);
	}).toThrow(/request.id/);
});

test('should serialize identical queries identically', () => {
	const reqA = createRequest({ query: 'test', type: 'query' });
	const reqB = createRequest({ query: 'test', type: 'query' });

	expect(reqA.id).toBe(reqB.id);
});

test('should set serialize the request.id as empty string', () => {
	const reqA = { query: 'test', type: 'query', variables: [1, 2] };
	const reqB = { query: 'test', type: 'mutation', variables: {} };

	const idA = createRequest(reqA as any).id;
	const idB = createRequest(reqB as any).id;

	expect(JSON.parse(idA)).toEqual({ ...reqA, id: '' });
	expect(JSON.parse(idB)).toEqual({ ...reqB, id: '' });
});

test('should not serialize if req.id is already set', () => {
	const req = createRequest({
		id: '__id__',
		query: 'test',
		type: 'query',
	});

	expect(req.id).toEqual('__id__');
});
