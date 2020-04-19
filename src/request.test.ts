// Ours
import { buildRequest } from './request';

test('should use stable stringify', () => {
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
	expect(buildRequest(obj1).id).toEqual(buildRequest(obj2).id);

	// array items DOES matter
	obj2.array = [2, 1];
	expect(buildRequest(obj1).id).not.toEqual(buildRequest(obj2).id);
});

test('should stringify the body and use it as id', () => {
	const bodyA = { query: 'test', variables: [1, 2] };
	const bodyB = { query: 'test', variables: {} };

	const idA = buildRequest(bodyA).id;
	const idB = buildRequest(bodyB).id;

	expect(JSON.parse(idA)).toEqual(bodyA);
	expect(JSON.parse(idB)).toEqual(bodyB);
});
