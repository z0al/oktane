// Ours
import { createRequest, Request } from './request';

test('should throw if request.type is set', () => {
	expect(() => {
		createRequest({ type: 'anything' } as any);
	}).toThrow(/request.type/);
});

test('should NOT throw if request.id is not set', () => {
	expect(() => {
		createRequest({});
	}).not.toThrow();
});

test('should throw if request.id is set to an invalid value', () => {
	expect(() => {
		createRequest({ id: 1 } as any);
	}).toThrow(/request.id/);

	expect(() => {
		createRequest({ id: '' } as any);
	}).toThrow(/request.id/);

	expect(() => {
		createRequest({ id: true } as any);
	}).toThrow(/request.id/);

	expect(() => {
		createRequest({ id: {} } as any);
	}).toThrow(/request.id/);

	expect(() => {
		createRequest({ id: [] } as any);
	}).toThrow(/request.id/);

	expect(() => {
		createRequest({ id: false } as any);
	}).toThrow(/request.id/);

	expect(() => {
		createRequest({ id: null } as any);
	}).toThrow(/request.id/);
});

test('should serialize identical queries identically', () => {
	const obj1 = {
		query: 'test',
		url: '/api/url',
		variables: {
			a: 1,
			b: 2,
		},
		array: [1, 2],
	};

	const obj2 = {
		url: '/api/url',
		query: 'test',
		variables: {
			b: 2,
			a: 1,
		},
		array: [1, 2],
	};

	// keys order doesn't matter
	expect(createRequest(obj1)).toEqual(createRequest(obj2));

	// array items DOES matter
	obj2.array = [2, 1];
	expect(createRequest(obj1)).not.toEqual(createRequest(obj2));
});

test('should set serialize the request.id as empty string', () => {
	const reqA = { query: 'test', variables: [1, 2] } as Request;
	const reqB = { query: 'test', variables: {} } as Request;

	const idA = createRequest(reqA).id;
	const idB = createRequest(reqB).id;

	expect(JSON.parse(idA)).toEqual({ ...reqA, id: '' });
	expect(JSON.parse(idB)).toEqual({ ...reqB, id: '' });
});

test('should not serialize if req.id is already set', () => {
	const req = createRequest({
		id: '__id__',
		query: 'test',
	});

	expect(req.id).toEqual('__id__');
});
